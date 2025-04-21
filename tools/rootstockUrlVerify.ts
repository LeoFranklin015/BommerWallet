import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { RootstockWalletManager } from "../utils/RootstockWalletManager";

/**
 * Initialize the Rootstock URL verification tool
 */
export const createRootstockUrlVerifyTool = (rootstockWalletManager: RootstockWalletManager) => {
  return new DynamicStructuredTool({
    name: "verify_rootstock_url",
    description: "Verify if a URL is a valid Rootstock domain or dApp",
    schema: z
      .object({
        url: z.string().describe("The URL to verify"),
      })
      .strict(),
    func: async (input: any) => {
      try {
        console.log(`🔧 Executing Rootstock URL verification tool with input:`, input);

        if (!input.url) {
          throw new Error("URL is required for verification");
        }

        const isValid = rootstockWalletManager.verifyRootstockUrl(input.url);

        const result = {
          success: true,
          url: input.url,
          isValidRootstockUrl: isValid,
          message: isValid 
            ? `The URL ${input.url} is a verified Rootstock domain.`
            : `The URL ${input.url} is NOT a verified Rootstock domain. Proceed with caution.`,
          timestamp: new Date().toISOString(),
        };

        return JSON.stringify(result);
      } catch (error) {
        console.error("Error with Rootstock URL verification tool:", error);
        if (error instanceof Error) {
          return JSON.stringify({
            success: false,
            message: `Error verifying URL: ${error.message}`,
          });
        }
        return JSON.stringify({
          success: false,
          message: "Error verifying URL: An unknown error occurred.",
        });
      }
    },
  });
}; 