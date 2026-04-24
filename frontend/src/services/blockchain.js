// Purpose: MetaMask wallet connection + optional on-chain verification via ethers.js.

import { ethers } from "ethers";
import { issueCertificate } from "./api";

const CERTIFICATE_ABI = [
  "function issueCertificate(uint256 id, address student, bytes32 dataHash, string metadataURI)",
  "function revokeCertificate(uint256 id)",
  "function verifyCertificate(uint256 id, bytes32 expectedHash) view returns (bool)",
  "function getCertificate(uint256 id) view returns (tuple(uint256 id, address student, address issuer, bytes32 dataHash, uint256 issuedAt, bool revoked, string metadataURI))"
];

function normalizeWalletError(error, fallbackMessage = "Không thể kết nối MetaMask") {
  const code = error?.code;
  const raw = String(
    error?.reason ||
    error?.shortMessage ||
    error?.message ||
    error?.info?.error?.message ||
    ""
  ).toLowerCase();

  if (code === 4001 || code === "ACTION_REJECTED" || raw.includes("user rejected") || raw.includes("ethers-user-denied")) {
    return "Bạn đã hủy yêu cầu trên MetaMask.";
  }

  if (raw.includes("no provider") || raw.includes("metamask") || raw.includes("ethereum")) {
    return "Không phát hiện MetaMask. Vui lòng mở extension và thử lại.";
  }

  return fallbackMessage;
}

export async function connectWallet(options = {}) {
  if (!window.ethereum) {
    throw new Error("Không phát hiện MetaMask. Vui lòng cài đặt trước.");
  }

  // If the site was previously authorized, MetaMask may auto-return the currently selected account
  // without showing the account picker. Use forceAccountSelection to re-trigger the selection UI.
  const forceAccountSelection = Boolean(options?.forceAccountSelection);

  const provider = new ethers.BrowserProvider(window.ethereum);

  try {
    if (forceAccountSelection) {
      // This triggers MetaMask's account selection / permission prompt.
      await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
    }

    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return { provider, signer, address };
  } catch (error) {
    throw new Error(normalizeWalletError(error));
  }
}

export function getContractReadOnly(provider) {
  const address = import.meta.env.VITE_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("Thiếu VITE_CONTRACT_ADDRESS trong file env của frontend");
  }
  return new ethers.Contract(address, CERTIFICATE_ABI, provider);
}

export function getContractWithSigner(signer) {
  const address = import.meta.env.VITE_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("Thiếu VITE_CONTRACT_ADDRESS trong file env của frontend");
  }
  return new ethers.Contract(address, CERTIFICATE_ABI, signer);
}

export async function issueCertificateOnChain({ id, studentAddress, dataHash, metadataURI }) {
  const { signer } = await connectWallet();
  const contract = getContractWithSigner(signer);

  const tx = await contract.issueCertificate(
    Number(id),
    studentAddress,
    dataHash,
    metadataURI || ""
  );

  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    receipt
  };
}

export async function revokeCertificateOnChain(id) {
  const { signer } = await connectWallet();
  const contract = getContractWithSigner(signer);
  const tx = await contract.revokeCertificate(Number(id));
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    receipt
  };
}

export async function verifyOnChain({ id, expectedHashHex }) {
  // expectedHashHex should be 64 hex chars (no 0x) or 0x-prefixed 32 bytes.
  const { provider } = await connectWallet();
  const contract = getContractReadOnly(provider);

  const normalized = String(expectedHashHex).toLowerCase().replace(/^0x/, "");
  if (normalized.length !== 64) throw new Error("expectedHashHex phải đủ 32 bytes (64 ký tự hex)");

  const valid = await contract.verifyCertificate(Number(id), "0x" + normalized);
  return Boolean(valid);
}

export async function issueCertificateHybridFlow(payload) {
  const createRes = await issueCertificate({
    ...payload,
  });
  if (!createRes?.success) {
    throw new Error(createRes?.message || "Tạo chứng chỉ thất bại.");
  }

  return {
    create: createRes,
    txHash: createRes?.data?.blockchainTxHash || ""
  };
}
