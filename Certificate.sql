-- ========================================
-- SAFE DATABASE INIT (KHÔNG XÓA DỮ LIỆU THẬT)
-- ========================================
USE master;
GO
IF DB_ID('CertificateDB') IS NULL
    CREATE DATABASE CertificateDB;
GO
GO
USE CertificateDB;
GO

-- ========================================
-- 1. USERS (ĐỊNH DANH HỆ THỐNG)
-- ========================================
CREATE TABLE Users (
    UserID INT IDENTITY PRIMARY KEY,

    -- Ví Ethereum (0x + 40 hex)
    WalletAddress CHAR(42) NOT NULL UNIQUE,

    -- Vai trò hệ thống
    Role NVARCHAR(20) NOT NULL
        CHECK (Role IN ('ADMIN', 'ISSUER', 'STUDENT', 'HOLDER')),

    Name NVARCHAR(200) NOT NULL,
    Email NVARCHAR(100) NULL,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,

    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),

    -- Validate địa chỉ ví
    CONSTRAINT CK_Users_WalletFormat
        CHECK (WalletAddress LIKE '0x%' AND LEN(WalletAddress) = 42)
);
GO

-- ========================================
-- 2. ISSUERS (TỔ CHỨC CẤP CHỨNG CHỈ)
-- ========================================
CREATE TABLE Issuers (
    IssuerID INT IDENTITY PRIMARY KEY,

    UserID INT NOT NULL UNIQUE,
    IsActive BIT DEFAULT 1,

    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Issuers_Users
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

-- ========================================
-- 3. CERTIFICATES (CORE - KHỚP SMART CONTRACT)
-- ========================================
CREATE TABLE Certificates (
    -- ID từ backend / blockchain
    CertificateID INT NOT NULL,

    -- Hỗ trợ multi-contract (rất quan trọng)
    ContractAddress CHAR(42) NOT NULL,

    StudentID INT NOT NULL,
    IssuerID INT NOT NULL,

    CourseName NVARCHAR(200) NOT NULL,
    IssueDate DATETIME2 DEFAULT SYSDATETIME(),

    -- Hash SHA-256 (0x + 64 hex)
    DataHash CHAR(66) NOT NULL,

    -- Transaction hash từ blockchain
    BlockchainTxHash CHAR(66) NULL,

    -- Metadata URI (https hoặc ipfs)
    MetadataURI NVARCHAR(500) NULL,

    -- Trạng thái nghiệp vụ
    Status NVARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (Status IN ('PENDING', 'ACTIVE', 'REVOKED', 'FAILED')),

    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),

    -- Khóa chính composite (chuẩn blockchain)
    CONSTRAINT PK_Certificates PRIMARY KEY (CertificateID, ContractAddress),

    -- FK
    CONSTRAINT FK_Cert_Student
        FOREIGN KEY (StudentID) REFERENCES Users(UserID),

    CONSTRAINT FK_Cert_Issuer
        FOREIGN KEY (IssuerID) REFERENCES Issuers(IssuerID),

    -- Validate hash
    CONSTRAINT CK_Cert_Hash
        CHECK (DataHash LIKE '0x%' AND LEN(DataHash) = 66),

    -- Validate tx hash
    CONSTRAINT CK_Cert_TxHash
        CHECK (BlockchainTxHash IS NULL OR
              (BlockchainTxHash LIKE '0x%' AND LEN(BlockchainTxHash) = 66)),

    -- Validate contract address
    CONSTRAINT CK_Cert_Contract
        CHECK (ContractAddress LIKE '0x%' AND LEN(ContractAddress) = 42),

    -- Validate metadata (match smart contract)
    CONSTRAINT CK_MetadataURI
        CHECK (
            MetadataURI IS NULL OR
            MetadataURI LIKE 'https://%' OR
            MetadataURI LIKE 'ipfs://%'
        )
);
GO

-- ========================================
-- 4. UNIQUE LOGIC (CHỐNG CẤP TRÙNG)
-- ========================================
CREATE UNIQUE INDEX UX_OneActiveCertPerCourse
ON Certificates(StudentID, CourseName, ContractAddress)
WHERE Status IN ('PENDING', 'ACTIVE');
GO

-- ========================================
-- 5. INDEX TỐI ƯU TRUY VẤN
-- ========================================
CREATE INDEX IX_Cert_Student
ON Certificates(StudentID);

CREATE INDEX IX_Cert_Hash
ON Certificates(DataHash);

CREATE INDEX IX_Cert_Verify
ON Certificates(CertificateID, DataHash, Status);
GO

-- ========================================
-- 6. AUDIT LOG (THEO DÕI HÀNH VI)
-- ========================================
CREATE TABLE CertificateLogs (
    LogID INT IDENTITY PRIMARY KEY,

    CertificateID INT,
    ContractAddress CHAR(42),

    Action NVARCHAR(50), -- ISSUE / REVOKE / VERIFY
    TxHash CHAR(66),

    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),

    -- Liên kết với Certificates (tránh data rác)
    CONSTRAINT FK_Log_Cert
        FOREIGN KEY (CertificateID, ContractAddress)
        REFERENCES Certificates(CertificateID, ContractAddress)
);
GO

-- ========================================
-- 7. SAMPLE DATA (KHỚP BLOCKCHAIN THỰC TẾ)
-- ========================================

-- Bộ ví quyền thật (khuyến nghị giữ nguyên)
-- Admin + Issuer: 0x897c7F0D6e9E43Ab5CfE366A5BDBAe6C69c59D41
-- Issuer:          0xFdc9Cdd8a9907169d2faf2E8a1c41Fdd6031b449
-- Holder thật:     0xF24C4FADeDf4f23796011e8C634A46e558Ff60AB
-- Contract:        0x817467672402cD1D14d337E99b568166aaDCa098
-- Tài khoản đăng nhập mẫu:
-- admin / admin123
-- issuer / issuer123
-- holder / holder123

DECLARE @ContractAddress CHAR(42) = '0x817467672402cD1D14d337E99b568166aaDCa098';

-- ADMIN (ví deploy contract)
IF NOT EXISTS (SELECT 1 FROM Users WHERE WalletAddress = '0x897c7F0D6e9E43Ab5CfE366A5BDBAe6C69c59D41')
BEGIN
    INSERT INTO Users (WalletAddress, Role, Name, Username, PasswordHash)
    VALUES (
        '0x897c7F0D6e9E43Ab5CfE366A5BDBAe6C69c59D41',
        'ADMIN',
        N'Admin',
        N'admin',
        '$2b$10$u9Y2fpLvhWQP10jesnJtce4gQUjDunHfaExxq/aT1fjEmn0MAsdJK'
    );
END

-- ISSUER thật (đã addIssuer on-chain)
IF NOT EXISTS (SELECT 1 FROM Users WHERE WalletAddress = '0xFdc9Cdd8a9907169d2faf2E8a1c41Fdd6031b449')
BEGIN
    INSERT INTO Users (WalletAddress, Role, Name, Username, PasswordHash)
    VALUES (
        '0xFdc9Cdd8a9907169d2faf2E8a1c41Fdd6031b449',
        'ISSUER',
        N'Đại học Đồng Tháp',
        N'issuer',
        '$2b$10$pZQlWS9WOjj7YYjkHOegX.Q749tRaugg7CZMErYebuKFBYoD4/NJG'
    );
END

IF NOT EXISTS (
    SELECT 1
    FROM Issuers i
    INNER JOIN Users u ON u.UserID = i.UserID
    WHERE u.WalletAddress = '0xFdc9Cdd8a9907169d2faf2E8a1c41Fdd6031b449'
)
BEGIN
    INSERT INTO Issuers (UserID)
    SELECT UserID
    FROM Users
    WHERE WalletAddress = '0xFdc9Cdd8a9907169d2faf2E8a1c41Fdd6031b449';
END

-- ISSUER mẫu thứ 2 (ví giả trong DB để test đăng nhập và UI theo issuerId)
IF EXISTS (SELECT 1 FROM Users WHERE Username = N'iss2')
BEGIN
    UPDATE Users
    SET
        WalletAddress = '0x3333333333333333333333333333333333333333',
        Role = 'ISSUER',
        Name = N'Issuer Mẫu 2',
        PasswordHash = '$2b$10$gvwB65YZ/i31ckSYc2CXQ.EhidBHwX5zZJ4zbjIfoxt4Ulj8qMnHS'
    WHERE Username = N'iss2';
END
ELSE
BEGIN
    INSERT INTO Users (WalletAddress, Role, Name, Username, PasswordHash)
    VALUES (
        '0x3333333333333333333333333333333333333333',
        'ISSUER',
        N'Issuer Mẫu 2',
        N'iss2',
        '$2b$10$gvwB65YZ/i31ckSYc2CXQ.EhidBHwX5zZJ4zbjIfoxt4Ulj8qMnHS'
    );
END

IF NOT EXISTS (
    SELECT 1
    FROM Issuers i
    INNER JOIN Users u ON u.UserID = i.UserID
    WHERE u.WalletAddress = '0x3333333333333333333333333333333333333333'
)
BEGIN
    INSERT INTO Issuers (UserID)
    SELECT UserID
    FROM Users
    WHERE WalletAddress = '0x3333333333333333333333333333333333333333';
END

-- HOLDER thật
IF NOT EXISTS (SELECT 1 FROM Users WHERE WalletAddress = '0xF24C4FADeDf4f23796011e8C634A46e558Ff60AB')
BEGIN
    INSERT INTO Users (WalletAddress, Role, Name, Username, PasswordHash)
    VALUES (
        '0xF24C4FADeDf4f23796011e8C634A46e558Ff60AB',
        'HOLDER',
        N'Phạm Chiến',
        N'holder',
        '$2b$10$Pf8UyEjOGH3pBljN0cNQLuDH3QwOWNKYEdDw50u0el4aAcqFyCKom'
    );
END

-- HOLDER giả để tăng dữ liệu demo (không cần private key)
IF NOT EXISTS (SELECT 1 FROM Users WHERE WalletAddress = '0x1111111111111111111111111111111111111111')
BEGIN
    INSERT INTO Users (WalletAddress, Role, Name, Username, PasswordHash)
    VALUES
    (
        '0x1111111111111111111111111111111111111111',
        'HOLDER',
        N'Người sở hữu mẫu 1',
        N'student1',
        '$2b$10$Pf8UyEjOGH3pBljN0cNQLuDH3QwOWNKYEdDw50u0el4aAcqFyCKom'
    );
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE WalletAddress = '0x2222222222222222222222222222222222222222')
BEGIN
    INSERT INTO Users (WalletAddress, Role, Name, Username, PasswordHash)
    VALUES
    (
        '0x2222222222222222222222222222222222222222',
        'HOLDER',
        N'Người sở hữu mẫu 2',
        N'student2',
        '$2b$10$Pf8UyEjOGH3pBljN0cNQLuDH3QwOWNKYEdDw50u0el4aAcqFyCKom'
    );
END

DECLARE @IssuerID INT = (
    SELECT TOP 1 i.IssuerID
    FROM Issuers i
    INNER JOIN Users u ON u.UserID = i.UserID
    WHERE u.WalletAddress = '0xFdc9Cdd8a9907169d2faf2E8a1c41Fdd6031b449'
);

DECLARE @StudentReal INT = (
    SELECT TOP 1 UserID
    FROM Users
    WHERE WalletAddress = '0xF24C4FADeDf4f23796011e8C634A46e558Ff60AB'
);

DECLARE @StudentFake1 INT = (
    SELECT TOP 1 UserID
    FROM Users
    WHERE WalletAddress = '0x1111111111111111111111111111111111111111'
);

DECLARE @StudentFake2 INT = (
    SELECT TOP 1 UserID
    FROM Users
    WHERE WalletAddress = '0x2222222222222222222222222222222222222222'
);

-- Chứng chỉ mẫu cho demo thống kê/verify/thu hồi
IF NOT EXISTS (SELECT 1 FROM Certificates WHERE CertificateID = 1 AND ContractAddress = @ContractAddress)
BEGIN
    INSERT INTO Certificates (
        CertificateID,
        ContractAddress,
        StudentID,
        IssuerID,
        CourseName,
        IssueDate,
        DataHash,
        Status
    )
    VALUES (
        1,
        @ContractAddress,
        @StudentReal,
        @IssuerID,
        N'Tesnet Cơ Bản',
        DATEADD(DAY, -7, SYSDATETIME()),
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'REVOKED'
    );
END

IF NOT EXISTS (SELECT 1 FROM Certificates WHERE CertificateID = 2 AND ContractAddress = @ContractAddress)
BEGIN
    INSERT INTO Certificates (
        CertificateID,
        ContractAddress,
        StudentID,
        IssuerID,
        CourseName,
        IssueDate,
        DataHash,
        Status
    )
    VALUES (
        2,
        @ContractAddress,
        @StudentFake1,
        @IssuerID,
        N'Smart Contract Cơ Bản',
        DATEADD(DAY, -3, SYSDATETIME()),
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        'ACTIVE'
    );
END

IF NOT EXISTS (SELECT 1 FROM Certificates WHERE CertificateID = 3 AND ContractAddress = @ContractAddress)
BEGIN
    INSERT INTO Certificates (
        CertificateID,
        ContractAddress,
        StudentID,
        IssuerID,
        CourseName,
        IssueDate,
        DataHash,
        Status
    )
    VALUES (
        3,
        @ContractAddress,
        @StudentFake2,
        @IssuerID,
        N'Blockchain Nâng Cao',
        DATEADD(DAY, -1, SYSDATETIME()),
        '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
        'ACTIVE'
    );
END

IF NOT EXISTS (SELECT 1 FROM Certificates WHERE CertificateID = 4 AND ContractAddress = @ContractAddress)
BEGIN
    INSERT INTO Certificates (
        CertificateID,
        ContractAddress,
        StudentID,
        IssuerID,
        CourseName,
        IssueDate,
        DataHash,
        Status
    )
    VALUES (
        4,
        @ContractAddress,
        @StudentFake1,
        @IssuerID,
        N'DApp Security',
        SYSDATETIME(),
        '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
        'ACTIVE'
    );
END
GO



SELECT * FROM Users;
SELECT * FROM Issuers;

SELECT CertificateID, ContractAddress, StudentID, IssuerID, CourseName, Status
FROM Certificates
ORDER BY CertificateID;

SELECT UserID, Role, Username, WalletAddress FROM Users;
SELECT * FROM Issuers;

SELECT MAX(CertificateID) FROM Certificates;

SELECT Username, Role, WalletAddress, PasswordHash
FROM Users
WHERE Username = 'iss2';