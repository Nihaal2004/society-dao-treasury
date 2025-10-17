/* SPDX-License-Identifier: MIT */
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Votes} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract MembershipSBT is ERC721, ERC721Votes, Ownable {
    uint256 public nextId = 1;
    mapping(address => bool) public isMember;

    event MemberMinted(address indexed to, uint256 tokenId);
    event DuesPaid(address indexed member, uint256 amount, string note);

    constructor(address admin)
        ERC721("Society Membership", "SBT")
        EIP712("Society Membership", "1")
        Ownable(admin)
    {}

    function mint(address to) external onlyOwner returns (uint256) {
        require(!isMember[to], "Already member");
        uint256 id = nextId++;
        _mint(to, id);
        isMember[to] = true;
        _delegate(to, to); // self-delegate votes
        emit MemberMinted(to, id);
        return id;
    }

    function revoke(uint256 tokenId) external onlyOwner {
        address holder = ownerOf(tokenId);
        isMember[holder] = false;
        _burn(tokenId);
    }

    function payDues(string calldata note) external payable {
        require(isMember[msg.sender], "Not member");
        require(msg.value > 0, "Zero");
        emit DuesPaid(msg.sender, msg.value, note);
    }

    // Soulbound: block transfers except mint and burn
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Votes)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("SBT: non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    // Resolve multiple inheritance for ERC721Votes
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Votes)
    {
        super._increaseBalance(account, value);
    }
}
