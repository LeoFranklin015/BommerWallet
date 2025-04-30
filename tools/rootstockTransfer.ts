import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { RootstockWalletManager } from "../utils/RootstockWalletManager";

/**
 * Initialize the Rootstock transfer tool
 */
export const createRootstockTransferTool = (rootstockWalletManager: RootstockWalletManager) => {
  return new DynamicStructuredTool({
    name: "rootstock_transfer",
    description: "Send RBTC from the user's Rootstock wallet to another address",
    schema: z
      .object({
        amount: z.string().describe("The amount of RBTC to transfer"),
        recipient: z.string().describe("The recipient's Rootstock address"),
        memo: z
          .string()
          .optional()
          .describe("Optional memo to include with the transaction"),
        chatId: z
          .string()
          .describe("The chat ID to identify the sender's wallet"),
      })
      .strict(),
    func: async (input: any) => {
      try {
        console.log(`🔧 Executing Rootstock transfer tool with input:`, input);

        if (!input.chatId) {
          throw new Error(
            "Chat ID is required to identify the sender's wallet"
          );
        }

        if (!rootstockWalletManager.hasWallet(input.chatId)) {
          return JSON.stringify({
            success: false,
            message: "You don't have a Rootstock wallet yet. Create one first with 'create rootstock wallet'."
          });
        }

        const balance = await rootstockWalletManager.getBalance(input.chatId);
        
        if (parseFloat(balance) < parseFloat(input.amount)) {
          return JSON.stringify({
            success: false,
            message: `Insufficient balance. You have ${balance} RBTC, but tried to send ${input.amount} RBTC.`
          });
        }

        const txHash = await rootstockWalletManager.sendRBTC(
          input.chatId,
          input.recipient,
          input.amount,
          input.memo
        );

        const result = {
          success: true,
          amount: input.amount,
          recipient: input.recipient,
          txHash: txHash,
          message: `Successfully sent ${input.amount} RBTC to ${input.recipient}`,
          timestamp: new Date().toISOString(),
        };

        return JSON.stringify(result);
      } catch (error) {
        console.error("Error with Rootstock transfer tool:", error);
        if (error instanceof Error) {
          return JSON.stringify({
            success: false,
            message: `Error executing transfer: ${error.message}`,
          });
        }
        return JSON.stringify({
          success: false,
          message: "Error executing transfer: An unknown error occurred.",
        });
      }
    },
  });
}; 