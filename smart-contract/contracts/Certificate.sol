// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Certificate Verification Layer
/// @notice Minimal on-chain verification registry for certificate hashes.
/// @dev Blockchain chỉ dùng để VERIFY dữ liệu (hash), không chứa business logic
contract Certificate {

    /// @dev Admin của hệ thống (platform owner / cơ quan quản lý)
    address public admin;

    /// @notice Cấu trúc dữ liệu tối thiểu lưu trên blockchain
    /// @dev Không lưu thông tin nghiệp vụ (tên, khóa học...) → tránh tốn gas & sai vai trò
    struct CertificateData {
        uint256 id;          // ID chứng chỉ (liên kết DB backend)
        address student;     // Ví sinh viên (định danh ownership)
        address issuer;      // Ví tổ chức cấp bằng
        bytes32 dataHash;    // Hash SHA-256 từ backend (đảm bảo integrity)
        uint256 issuedAt;    // Timestamp cấp bằng
        bool revoked;        // Trạng thái thu hồi (không xóa dữ liệu)
        string metadataURI;  // Link metadata (https/ipfs hoặc "")
    }

    /// @dev Mapping lưu trữ chứng chỉ theo ID
    mapping(uint256 => CertificateData) private certificates;

    /// @dev Danh sách tổ chức được phép cấp bằng
    mapping(address => bool) public isIssuer;

    // ----------------------------
    // Custom Errors (tiết kiệm gas hơn require string)
    // ----------------------------
    error NotAdmin();
    error NotIssuer();
    error AlreadyExists();
    error NotFound();
    error AlreadyRevoked();
    error BadStudent();
    error BadHash();
    error BadIssuer();
    error BadAdmin();
    error IssuerNotFound();
    error CannotRemoveAdminIssuer();
    error BadMetadataURI(); // ❗ chống dữ liệu rác từ FE/BE

    // ----------------------------
    // Events (dùng cho frontend/backend tracking)
    // ----------------------------
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event CertificateIssued(uint256 indexed id, address indexed student, address indexed issuer, bytes32 dataHash);
    event CertificateRevoked(uint256 indexed id, address indexed revoker);

    // ----------------------------
    // Modifiers (kiểm soát quyền)
    // ----------------------------
    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyIssuer() {
        if (!isIssuer[msg.sender]) revert NotIssuer();
        _;
    }

    /// @notice Constructor: deployer là admin + issuer mặc định
    constructor() {
        admin = msg.sender;
        isIssuer[msg.sender] = true;
    }

    // ----------------------------
    // ISSUER MANAGEMENT
    // ----------------------------

    /// @notice Thêm tổ chức cấp bằng
    function addIssuer(address issuer) external onlyAdmin {
        if (issuer == address(0)) revert BadIssuer();

        // Idempotent: gọi lại không lỗi
        if (isIssuer[issuer]) return;

        isIssuer[issuer] = true;
        emit IssuerAdded(issuer);
    }

    /// @notice Gỡ quyền tổ chức
    function removeIssuer(address issuer) external onlyAdmin {
        if (issuer == address(0)) revert BadIssuer();
        if (issuer == admin) revert CannotRemoveAdminIssuer();
        if (!isIssuer[issuer]) revert IssuerNotFound();

        isIssuer[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    /// @notice Chuyển quyền admin
    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert BadAdmin();

        address previousAdmin = admin;
        admin = newAdmin;

        // đảm bảo admin mới luôn có quyền issuer
        isIssuer[newAdmin] = true;

        emit AdminTransferred(previousAdmin, newAdmin);
    }

    // ----------------------------
    // INTERNAL VALIDATION
    // ----------------------------

    /// @dev Chỉ cho phép "" hoặc https:// hoặc ipfs://
    /// → tránh lưu localhost lên blockchain public
    function _isValidMetadataURI(string calldata uri) internal pure returns (bool) {
        bytes memory b = bytes(uri);

        if (b.length == 0) return true;

        // https://
        if (
            b.length >= 8 &&
            b[0]=='h' && b[1]=='t' && b[2]=='t' && b[3]=='p' &&
            b[4]=='s' && b[5]==':' && b[6]=='/' && b[7]=='/'
        ) return true;

        // ipfs://
        if (
            b.length >= 7 &&
            b[0]=='i' && b[1]=='p' && b[2]=='f' && b[3]=='s' &&
            b[4]==':' && b[5]=='/' && b[6]=='/'
        ) return true;

        return false;
    }

    // ----------------------------
    // CORE FUNCTIONS
    // ----------------------------

    /// @notice Cấp chứng chỉ (chỉ issuer)
    /// @dev Hash được tạo ở backend → đảm bảo thống nhất dữ liệu
    function issueCertificate(
        uint256 id,
        address student,
        bytes32 dataHash,
        string calldata metadataURI
    ) external onlyIssuer {

        if (certificates[id].issuer != address(0)) revert AlreadyExists();
        if (student == address(0)) revert BadStudent();
        if (dataHash == bytes32(0)) revert BadHash();

        // ❗ chống FE/BE gửi localhost hoặc dữ liệu rác
        if (!_isValidMetadataURI(metadataURI)) revert BadMetadataURI();

        certificates[id] = CertificateData({
            id: id,
            student: student,
            issuer: msg.sender,
            dataHash: dataHash,
            issuedAt: block.timestamp,
            revoked: false,
            metadataURI: metadataURI
        });

        emit CertificateIssued(id, student, msg.sender, dataHash);
    }

    /// @notice Thu hồi chứng chỉ
    /// @dev Admin luôn có quyền; issuer gốc cũng có quyền
    /// → quyền gắn với certificate, không phụ thuộc trạng thái hiện tại
    function revokeCertificate(uint256 id) external {
        CertificateData storage cert = certificates[id];

        if (cert.issuer == address(0)) revert NotFound();
        if (cert.revoked) revert AlreadyRevoked();

        if (msg.sender != admin && msg.sender != cert.issuer) {
            revert NotIssuer();
        }

        cert.revoked = true;
        emit CertificateRevoked(id, msg.sender);
    }

    /// @notice Verify chứng chỉ bằng hash
    /// @dev Nếu hash khác → dữ liệu đã bị thay đổi (fake)
    function verifyCertificate(uint256 id, bytes32 expectedHash)
        external
        view
        returns (bool valid)
    {
        CertificateData storage c = certificates[id];

        if (expectedHash == bytes32(0)) return false;
        if (c.issuer == address(0)) return false;
        if (c.revoked) return false;

        return c.dataHash == expectedHash;
    }

    /// @notice Lấy thông tin chứng chỉ (phục vụ UI/debug)
    /// @dev Không ảnh hưởng logic verify
    function getCertificate(uint256 id)
        external
        view
        returns (CertificateData memory)
    {
        if (certificates[id].issuer == address(0)) revert NotFound();
        return certificates[id];
    }
}