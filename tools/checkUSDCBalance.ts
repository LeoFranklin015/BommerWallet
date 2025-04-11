// import { DynamicStructuredTool } from "@langchain/core/tools";
// import { z } from "zod";
// import { USDC_ADDRESS } from "../const";
// import { WalletClientBase } from "@goat-sdk/core";

// export const checkUSDCBalance = () => {
//   return new DynamicStructuredTool({
//     name: "USDC Balance ",
//     description: "A tool to fetch the balance of USDC token",
//     schema: z
//       .object({
//         walletClient: z.instanceof(WalletClientBase),
//       })
//       .strict(),
//     func: async (walletClient) => {
//       const balance = await walletClient.({
//         address: USDC_ADDRESS,
//       });
//       return balance.toString();
//     },
//   });
// };
