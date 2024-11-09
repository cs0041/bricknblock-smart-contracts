// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ReentrancyGuard.sol";
import "./interface/IFactoryFundraising.sol";

/**
 * @title RealEstateNFT
 * @dev Implementation of a Real Estate NFT system
 */
contract RealEstateNFT is ERC721, AccessControl, ReentrancyGuard {


    uint256 private _tokenIds;
    IFactoryFundraising public fundraisingFactory;

    // Property details structure
    struct Property {
        string name; // name of the property
        string location; // Physical location of the property
        uint256 area; // Area in square meters
        string propertyType; // Type of property (e.g., residential, commercial)
        string documents; // IPFS hash of property documents
        string image; // IPFS of property image
        bool isVerified; // Verification status
        bool isTokenized; // Whether the property has been tokenized
        address propertyToken; //address PropertyToken after tokenized
        address owner; // Owner's address
    }

    // Mappings
    mapping(uint256 => Property) public properties; // TokenId to Property mapping

    // Events
    event PropertyMinted(uint256 indexed tokenId, address indexed owner);

    event PropertyVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        uint256 timestamp
    );

    event PropertyTokenized(
        uint256 indexed tokenId,
        address indexed tokenized,
        uint256 timestamp
    );

    constructor() ERC721("Real Estate NFT", "RENFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mintProperty(
        string memory name,
        string memory location,
        uint256 area,
        string memory propertyType,
        string memory documents,
        string memory image
    ) public nonReentrant returns (uint256) {
        require(bytes(location).length > 0, "Location cannot be empty");
        require(area > 0, "Area must be greater than 0");

        uint256 newTokenId = _tokenIds++;

        // Create new property
        properties[newTokenId] = Property({
            name:name,
            location: location,
            area: area,
            propertyType: propertyType,
            documents: documents,
            image: image,
            isVerified: false,
            isTokenized: false,
            propertyToken: address(0),
            owner: msg.sender
        });

        _safeMint(msg.sender, newTokenId);

        emit PropertyMinted(newTokenId, msg.sender);

        return newTokenId;
    }

    function verifyProperty(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Property does not exist");
        require(!properties[tokenId].isVerified, "Property already verified");

        properties[tokenId].isVerified = true;

        emit PropertyVerified(tokenId, msg.sender, block.timestamp);
    }

    function setTokenized(address _propertyToken, uint256 tokenId) external {
        require(
            fundraisingFactory.getNFTFundraising(tokenId) == msg.sender,
            "Only NFTFundraising"
        );
        require(!properties[tokenId].isTokenized, "Property already tokenized");

        properties[tokenId].isVerified = true;
        properties[tokenId].isTokenized = true;
        properties[tokenId].propertyToken = _propertyToken;

        emit PropertyTokenized(tokenId, msg.sender, block.timestamp);
    }

    function getProperty(
        uint256 tokenId
    ) external view returns (Property memory) {
        require(_ownerOf(tokenId) != address(0), "Property does not exist");
        return properties[tokenId];
    }

    function setIFactoryFundraising(address _IFactoryFundraising) external {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Must have admin role"
        );
        fundraisingFactory = IFactoryFundraising(_IFactoryFundraising);
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
