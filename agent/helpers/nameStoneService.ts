import NameStone, {
  AuthenticationError,
  NetworkError,
  NameData,
} from "@namestone/namestone-sdk";

export interface NameStoneConfig {
  apiKey?: string;
  domain?: string;
}

export interface SubnameCreationResult {
  success: boolean;
  subname?: string;
  error?: string;
  message?: string;
}

export class NameStoneService {
  private ns: NameStone | null = null;
  private config: NameStoneConfig;

  constructor(config: NameStoneConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NAMESTONE_API_KEY,
      domain: config.domain || "calendefi.eth", // Default domain for calendar subnames
    };
  }

  /**
   * Initialize the NameStone client
   */
  private initializeClient(): boolean {
    try {
      if (!this.config.apiKey) {
        console.warn(
          "⚠️ NameStone API key not found. Skipping subname creation."
        );
        return false;
      }

      this.ns = new NameStone(this.config.apiKey);
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize NameStone client:", error);
      return false;
    }
  }

  /**
   * Generate a unique subname for a calendar
   */
  private generateUniqueSubname(calendarId: string): string {
    // Extract a meaningful identifier from calendarId
    // Calendar IDs are typically in format: user@gmail.com or similar
    const identifier = calendarId.split("@")[0] || calendarId;

    // Create a hash-like identifier for uniqueness
    const timestamp = Date.now().toString(36);
    const hash = this.simpleHash(calendarId).toString(36);

    // Combine identifier with hash for uniqueness
    const subname = `${identifier}-${hash}-${timestamp}`.toLowerCase();

    // Ensure it's valid for ENS (alphanumeric and hyphens only)
    return subname.replace(/[^a-z0-9-]/g, "").substring(0, 32);
  }

  /**
   * Simple hash function for generating unique identifiers
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Create a subname for a calendar
   */
  async createSubnameForCalendar(
    calendarId: string
  ): Promise<SubnameCreationResult> {
    try {
      // Initialize client if not already done
      if (!this.ns && !this.initializeClient()) {
        return {
          success: false,
          error: "NameStone client initialization failed",
          message: "API key not configured or client initialization failed",
        };
      }

      if (!this.ns) {
        return {
          success: false,
          error: "NameStone client not available",
          message: "Client could not be initialized",
        };
      }

      // Generate unique subname
      const subname = this.generateUniqueSubname(calendarId);
      const fullName = `${subname}.${this.config.domain}`;

      console.log(
        `🏷️ Attempting to create subname: ${fullName} for calendar: ${calendarId}`
      );

      // Try to create the subname
      const response = await this.ns.setName({
        name: subname,
        domain: this.config.domain!,
        address: "0x0000000000000000000000000000000000000000", // Placeholder address
      });

      console.log(`✅ Successfully created subname: ${fullName}`);

      return {
        success: true,
        subname: fullName,
        message: `Subname created successfully: ${fullName}`,
      };
    } catch (error) {
      console.error(
        `❌ Failed to create subname for calendar ${calendarId}:`,
        error
      );

      let errorMessage = "Unknown error occurred";

      if (error instanceof AuthenticationError) {
        errorMessage = "Authentication failed - check API key";
      } else if (error instanceof NetworkError) {
        errorMessage = "Network error occurred";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        message: `Subname creation failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get existing names for a domain
   */
  async getNamesForDomain(): Promise<NameData[]> {
    try {
      if (!this.ns && !this.initializeClient()) {
        console.warn("⚠️ Cannot get names - NameStone client not initialized");
        return [];
      }

      if (!this.ns) {
        return [];
      }

      const response = await this.ns.getNames({ domain: this.config.domain! });
      return response;
    } catch (error) {
      console.error("❌ Failed to get names for domain:", error);
      return [];
    }
  }

  /**
   * Check if a subname already exists
   */
  async checkSubnameExists(subname: string): Promise<boolean> {
    try {
      const names = await this.getNamesForDomain();
      return names.some((name) => name.name === subname);
    } catch (error) {
      console.error("❌ Failed to check subname existence:", error);
      return false;
    }
  }

  /**
   * Create subname with retry logic and existence check
   */
  async createSubnameWithRetry(
    calendarId: string,
    maxRetries: number = 3
  ): Promise<SubnameCreationResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.createSubnameForCalendar(calendarId);

        if (result.success) {
          return result;
        }

        // If it's an authentication or network error, don't retry
        if (
          result.error?.includes("Authentication") ||
          result.error?.includes("Network")
        ) {
          console.warn(
            `⚠️ Non-retryable error on attempt ${attempt}: ${result.error}`
          );
          return result;
        }

        console.warn(
          `⚠️ Attempt ${attempt} failed, retrying... (${result.error})`
        );

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} threw exception:`, error);

        if (attempt === maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            message: `All ${maxRetries} attempts failed`,
          };
        }
      }
    }

    return {
      success: false,
      error: "Max retries exceeded",
      message: `Failed after ${maxRetries} attempts`,
    };
  }
}
