import { Client, Message } from "whatsapp-web.js";
import { ethers } from "ethers";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { rootstock, rootstockTestnet } from "viem/chains";
import * as fs from 'fs-extra';
import { HELP_MESSAGE, GMX_HELP_MESSAGE, ROOTSTOCK_HELP_MESSAGE } from "./constants";
import * as path from 'path';
import * as bip39 from 'bip39';

// Wallet data storage path
const WALLET_DATA_PATH = "./.rootstock_wallet_data.json";

// Rootstock networks configuration
const ROOTSTOCK_NETWORKS = {
  mainnet: {
    chainId: 30,
    name: "Rootstock Mainnet",
    chain: rootstock,
    rpcUrl: "https://public-node.rsk.co",
    explorer: "https://explorer.rsk.co"
  },
  testnet: {
    chainId: 31,
    name: "Rootstock Testnet",
    chain: rootstockTestnet,
    rpcUrl: "https://public-node.testnet.rsk.co",
    explorer: "https://explorer.testnet.rsk.co"
  }
};

// Default network
const DEFAULT_NETWORK = "testnet";

interface WalletData {
  privateKey: string;
  address: string;
  mnemonic?: string;
}

interface ChatWalletStorage {
  [chatId: string]: WalletData;
}

// Define the structure for a chat's wallet
interface ChatWallet {
  address: string;
  wallet: ethers.Wallet;
  mnemonic: string;
  path: string;
}

// Structure for storing wallet data
interface StoredWalletData {
  address: string;
  mnemonic: string;
  path: string;
}

export class RootstockWalletManager {
  private wallets: ChatWalletStorage;
  private network: "mainnet" | "testnet";
  private providers: {[network: string]: ethers.JsonRpcProvider};
  private chatWallets: Map<string, ChatWallet>;
  private rootstockProvider: ethers.Provider;
  private arbitrumProvider: ethers.Provider;
  private walletStoragePath: string;

  constructor(network: "mainnet" | "testnet" = DEFAULT_NETWORK) {
    this.wallets = {};
    this.network = network;
    this.providers = {
      mainnet: new ethers.JsonRpcProvider(ROOTSTOCK_NETWORKS.mainnet.rpcUrl),
      testnet: new ethers.JsonRpcProvider(ROOTSTOCK_NETWORKS.testnet.rpcUrl)
    };
    this.chatWallets = new Map();
    this.walletStoragePath = path.join(process.cwd(), '.wallet_data.json');
    
    // Initialize providers for both networks
    this.rootstockProvider = new ethers.JsonRpcProvider('https://public-node.testnet.rsk.co');
    this.arbitrumProvider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    
    this.loadWallets();
  }

  /**
   * Load wallets from storage
   */
  private loadWallets(): void {
    try {
      if (fs.existsSync(WALLET_DATA_PATH)) {
        const data = fs.readFileSync(WALLET_DATA_PATH, 'utf8');
        this.wallets = JSON.parse(data);
        console.log(`Loaded ${Object.keys(this.wallets).length} Rootstock wallets from storage`);
      } else {
        this.wallets = {};
        console.log("No existing Rootstock wallet data found, creating new storage");
        this.saveWallets();
      }
    } catch (error) {
      console.error("Error loading Rootstock wallets:", error);
      this.wallets = {};
      this.saveWallets();
    }
  }

  /**
   * Save wallets to storage
   */
  private saveWallets(): void {
    try {
      fs.writeFileSync(WALLET_DATA_PATH, JSON.stringify(this.wallets, null, 2), 'utf8');
    } catch (error) {
      console.error("Error saving Rootstock wallets:", error);
    }
  }

  /**
   * Create a new wallet for a chat
   */
  public createWallet(chatId: string): WalletData {
    // Generate a new wallet
    const wallet = ethers.Wallet.createRandom();
    
    // Store wallet data
    this.wallets[chatId] = {
      privateKey: wallet.privateKey,
      address: wallet.address,
      mnemonic: wallet.mnemonic?.phrase
    };
    
    // Save to storage
    this.saveWallets();
    
    return this.wallets[chatId];
  }

  /**
   * Import a wallet using mnemonic phrase
   */
  public importWallet(chatId: string, mnemonic: string): WalletData | null {
    try {
      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      
      // Store wallet data
      this.wallets[chatId] = {
        privateKey: wallet.privateKey,
        address: wallet.address,
        mnemonic: mnemonic
      };
      
      // Save to storage
      this.saveWallets();
      
      return this.wallets[chatId];
    } catch (error) {
      console.error("Error importing wallet:", error);
      return null;
    }
  }

  /**
   * Get wallet for a chat
   */
  public getWallet(chatId: string): WalletData | null {
    return this.wallets[chatId] || null;
  }

  /**
   * Get wallet address for a chat
   */
  public getWalletAddress(chatId: string): string | null {
    const wallet = this.getWallet(chatId);
    return wallet ? wallet.address : null;
  }

  /**
   * Check if a wallet exists for a chat
   */
  public hasWallet(chatId: string): boolean {
    return !!this.wallets[chatId];
  }

  /**
   * Get balance for a wallet
   */
  public async getBalance(chatId: string): Promise<string> {
    const wallet = this.getWallet(chatId);
    
    if (!wallet) {
      throw new Error("No wallet found for this chat");
    }
    
    const provider = this.providers[this.network];
    const balance = await provider.getBalance(wallet.address);
    
    // Format balance in RBTC
    return ethers.formatEther(balance);
  }

  /**
   * Send RBTC from one wallet to another
   */
  public async sendRBTC(
    chatId: string,
    toAddress: string,
    amount: string,
    memo?: string
  ): Promise<string> {
    const wallet = this.getWallet(chatId);
    
    if (!wallet) {
      throw new Error("No wallet found for this chat");
    }
    
    const provider = this.providers[this.network];
    const signerWallet = new ethers.Wallet(wallet.privateKey, provider);
    
    // Convert amount to Wei
    const amountWei = ethers.parseEther(amount);
    
    // Get gas price and estimate gas
    const gasPrice = await provider.getFeeData();
    
    // Prepare transaction
    const tx = {
      to: toAddress,
      value: amountWei,
      gasPrice: gasPrice.gasPrice,
      data: memo ? ethers.hexlify(ethers.toUtf8Bytes(memo)) : undefined,
    };
    
    // Send transaction
    const transaction = await signerWallet.sendTransaction(tx);
    console.log(`Transaction sent: ${transaction.hash}`);
    
    // Return transaction hash
    return transaction.hash;
  }

  /**
   * Verify a URL is from Rootstock
   */
  public verifyRootstockUrl(url: string): boolean {
    // Check if URL is from Rootstock explorer or known Rootstock dApps
    const rootstockDomains = [
      'explorer.rsk.co',
      'explorer.testnet.rsk.co',
      'app.sovryn.app',
      'wallet.rsk.co',
      'defiant.app',
      'rif.moneyonchain.com'
    ];
    
    try {
      const urlObj = new URL(url);
      return rootstockDomains.some(domain => urlObj.hostname.includes(domain));
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle messages for Rootstock wallet commands
   */
  public async handleMessage(message: Message): Promise<string | null> {
    const command = message.body.trim().toLowerCase();
    const chatId = message.from;
    
    // Help commands
    if (command === "help" || command === "commands") {
      return HELP_MESSAGE;
    }

    if (command === "gmx help") {
      return GMX_HELP_MESSAGE;
    }

    if (command === "rootstock help") {
      return ROOTSTOCK_HELP_MESSAGE;
    }

    // Command: create wallet (or create rootstock wallet)
    if (command === "create wallet" || command === "create rootstock wallet") {
      const wallet = this.createWallet(chatId);
      return `✅ *Rootstock Wallet Created*\n\n` + 
             `*Address:* \`${wallet.address}\`\n\n` +
             `*Recovery Phrase:*\n\`${wallet.mnemonic}\`\n\n` +
             `🔐 Keep this recovery phrase secret and secure! ` +
             `Never share it with anyone.`;
    }
    
    // Command: import wallet <mnemonic> or import rootstock wallet <mnemonic>
    if (command.startsWith("import wallet ") || command.startsWith("import rootstock wallet ")) {
      const mnemonic = command.includes("rootstock") 
        ? command.slice("import rootstock wallet ".length).trim()
        : command.slice("import wallet ".length).trim();
        
      const wallet = this.importWallet(chatId, mnemonic);
      
      if (!wallet) {
        return "❌ *Import Failed*\n\nInvalid recovery phrase. Please try again with a valid 12-word mnemonic.";
      }
      
      return `✅ *Rootstock Wallet Imported*\n\n` +
             `*Address:* \`${wallet.address}\`\n\n` +
             `Your wallet has been successfully imported.`;
    }
    
    // Command: my address or rootstock address
    if (command === "my address" || command === "rootstock address" || command === "my rootstock address") {
      const address = this.getWalletAddress(chatId);
      
      if (!address) {
        return "❌ *No Wallet Found*\n\nYou don't have a Rootstock wallet yet. Create one with the command: *create wallet*";
      }
      
      return `*Your Rootstock Address:*\n\`${address}\``;
    }
    
    // Command: balance or rootstock balance
    if (command === "balance" || command === "rootstock balance") {
      if (!this.hasWallet(chatId)) {
        return "❌ *No Wallet Found*\n\nYou don't have a Rootstock wallet yet. Create one with the command: *create wallet*";
      }
      
      try {
        const balance = await this.getBalance(chatId);
        return `*Rootstock Balance:*\n${balance} RBTC`;
      } catch (error) {
        console.error("Error getting balance:", error);
        return "❌ *Error*\n\nFailed to get your balance. Please try again later.";
      }
    }
    
    // Command: send <amount> RBTC to <address> or send <amount> to <address>
    if ((command.startsWith("send ") && command.includes(" rbtc to ")) || 
        (command.startsWith("send ") && command.includes(" to "))) {
      
      let amount, toAddress;
      
      if (command.includes(" rbtc to ")) {
        const parts = command.split(" rbtc to ");
        amount = parts[0].replace("send ", "").trim();
        toAddress = parts[1].trim();
      } else {
        const parts = command.split(" to ");
        amount = parts[0].replace("send ", "").trim();
        toAddress = parts[1].trim();
      }
      
      if (!this.hasWallet(chatId)) {
        return "❌ *No Wallet Found*\n\nYou don't have a Rootstock wallet yet. Create one with the command: *create wallet*";
      }
      
      try {
        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          return "❌ *Invalid Amount*\n\nPlease specify a valid positive number.";
        }
        
        // Validate address
        if (!ethers.isAddress(toAddress)) {
          return "❌ *Invalid Address*\n\nPlease provide a valid Rootstock address.";
        }
        
        // Check balance
        const balance = await this.getBalance(chatId);
        if (parseFloat(balance) < amountNum) {
          return `❌ *Insufficient Balance*\n\nYou only have ${balance} RBTC, but tried to send ${amount} RBTC.`;
        }
        
        // Send RBTC
        const txHash = await this.sendRBTC(chatId, toAddress, amount);
        const explorerUrl = `${ROOTSTOCK_NETWORKS[this.network].explorer}/tx/${txHash}`;
        
        return `✅ *Transaction Sent*\n\n` +
               `*Amount:* ${amount} RBTC\n` +
               `*To:* ${toAddress}\n` +
               `*Transaction Hash:* \`${txHash}\`\n\n` +
               `*View on Explorer:*\n${explorerUrl}`;
      } catch (error) {
        console.error("Error sending RBTC:", error);
        return "❌ *Transaction Failed*\n\nFailed to send RBTC. Please try again later.";
      }
    }
    
    // Command: verify rootstock url <url> or verify url <url>
    if (command.startsWith("verify rootstock url ") || command.startsWith("verify url ")) {
      const url = command.includes("rootstock")
        ? command.slice("verify rootstock url ".length).trim()
        : command.slice("verify url ".length).trim();
      
      const isValid = this.verifyRootstockUrl(url);
      
      if (isValid) {
        return `✅ *Valid Rootstock URL*\n\n` +
               `The URL \`${url}\` is a verified Rootstock domain.`;
      } else {
        return `⚠️ *Caution*\n\n` +
               `The URL \`${url}\` is NOT a verified Rootstock domain. Proceed with caution.`;
      }
    }
    
    // No Rootstock command matched
    return null;
  }

  // Other methods (generateWallet, loadWalletData, etc.) would be similar 
  // to the original but adapted for Rootstock/Arbitrum...
} 