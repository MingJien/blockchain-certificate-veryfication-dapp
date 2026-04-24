# Smart Contract (Remix-compatible)

This folder contains the Solidity contract used to issue and verify certificates.

## Files
- `contracts/Certificate.sol`: On-chain registry storing SHA-256 hashes and revoke status.
- `scripts/deploy.js`: Optional Node deploy helper (requires ABI+bytecode artifact).
- `artifacts/`: Place exported build artifacts here (e.g., `Certificate.json`).

## Deploy with Remix (recommended)
1. Open https://remix.ethereum.org
2. Create a file `Certificate.sol` and paste the contents from `contracts/Certificate.sol`.
3. Compile with Solidity `^0.8.20`.
4. Deploy:
   - **Remix VM** for local testing, or
   - **Injected Provider - MetaMask** to deploy to a real testnet.
5. Copy the deployed **contract address**.

## Hook contract into backend & frontend
- Backend expects `CONTRACT_ADDRESS`, `RPC_URL`, `PRIVATE_KEY`.
- Frontend expects `VITE_CONTRACT_ADDRESS` (and optionally `VITE_CHAIN_ID`).

## Optional: deploy using the Node script
If you have an artifact JSON containing ABI+bytecode:
- Put it at `smart-contract/artifacts/Certificate.json`:
  ```json
  { "abi": [ ... ], "bytecode": "0x..." }
  ```
- Run:
  ```bash
  cd smart-contract/scripts
  node deploy.js
  ```


## 1. Thông tin hợp đồng
1. Contract Address:
0x817467672402cD1D14d337E99b568166aaDCa098 
2. Link Explorer (Blockscout):
https://eth-sepolia.blockscout.com/address/0x817467672402cD1D14d337E99b568166aaDCa098?tab=contract 
3. Transaction Deploy (Etherscan):
https://sepolia.etherscan.io/tx/0xb1cec2411beea4e201f37666085884067c6ae637763783c1ac47a3354e8c5622 
4. Transaction Deploy (Blockscout):
https://eth-sepolia.blockscout.com/tx/0xb1cec2411beea4e201f37666085884067c6ae637763783c1ac47a3354e8c5622
## 2.Cấu hình MetaMask
1. Network Name: Sepolia Test Network 
2. RPC URL: https://rpc.sepolia.org 
3. Chain ID: 11155111 
4. Currency Symbol: SepoliaETH
