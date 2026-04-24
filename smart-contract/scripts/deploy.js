/*
  Minimal deploy script (Node.js) using ethers.js.
  Purpose: deploy Certificate.sol without Hardhat (RPC + private key).

  Usage:
    cd smart-contract/scripts
    node deploy.js

  Env vars (PowerShell example):
    $env:RPC_URL="http://127.0.0.1:8545"
    $env:PRIVATE_KEY="0x..."

  Note:
  - You still need ABI/bytecode. Easiest path is deploying from Remix.
  - If you compile with a toolchain that outputs artifact JSON, place it at:
      smart-contract/artifacts/Certificate.json
    containing: { "abi": [...], "bytecode": "0x..." }
*/

const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    throw new Error("Missing RPC_URL or PRIVATE_KEY in environment.");
  }

  const artifactPath = path.join(__dirname, "..", "artifacts", "Certificate.json");
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Missing artifact at ${artifactPath}. Compile and export ABI+bytecode (see comments).`
    );
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Certificate contract deployed at:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
