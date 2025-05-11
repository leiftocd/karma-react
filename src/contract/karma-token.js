// src/services/contractService.js
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(`https://base-mainnet.infura.io/v3/9528e81fcbc54f12acd36b08204e4f2d`);

// Contract address
export const KARMA_TOKEN = '0x3971deB79AC2F42CBDA9c8b34C094040EDa8382B';

// abis
const KARMA_TOKEN_ABI = [
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function getCurrentProcess() view returns (uint256)",
    "event Mint(uint256 indexed seq, uint256 process, uint256 proofHash, uint256 mintedAmount, uint256 donationUSD)"
];

// Create karma token instance
export const karmaToken = new ethers.Contract(KARMA_TOKEN, KARMA_TOKEN_ABI, provider);

export async function getCurrentProcess() {
    const process = await karmaToken.getCurrentProcess();
    return process;
}

export async function queryMintEvents(fromBlock = 29656224, toBlock = 'latest') {
    try {
        // Use the same provider 
        const eventProvider = provider; 

        // Query mint events
        const filter = karmaToken.filters.Mint();
        const events = await karmaToken.queryFilter(filter, fromBlock, toBlock);

        return await Promise.all(events.map(async (event) => {
            // Fallback timestamp
            let timestamp = Math.floor(Date.now() / 1000); 
            try {
                if (event.blockNumber) {
                    const block = await eventProvider.getBlock(event.blockNumber);
                    if (block && block.timestamp) {
                        timestamp = block.timestamp;
                    }
                }
            } catch (error) {
                console.error(`Failed to fetch block ${event.blockNumber} for event ${event.transactionHash}:`, error);
            }
            // Map events to more readable format
            return {
                seq: Number(event.args[0]),
                process: Number(event.args[1]), 
                proofHash: event.args[2].toString(),
                mintedAmount: ethers.formatEther(event.args[3]),
                donationUSD: Number(event.args[4]),
                timestamp, // UNIX timestamp (in seconds)
                formattedTime: new Date(timestamp * 1000).toLocaleDateString()
            };
        }));
    } catch (error) {
        console.error('Error querying mint events:', error);
        throw error;
    }
}