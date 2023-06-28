// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUniswapV2Pair {
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

interface IUniswapV2Router { 
    function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
}

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
    function balanceOf(address account) external view returns (uint256);
}

contract UniSwapper {
    uint256 private constant ERC20_TRANSFER_SELECTOR = 0xa9059cbb00000000000000000000000000000000000000000000000000000000; // bytes4(keccak256("transfer(address,uint256)"))
    uint256 private constant UNISWAP_PAIR_SWAP_SELECTOR = 0x022c0d9f00000000000000000000000000000000000000000000000000000000; // bytes4(keccak256("swap(uint256,uint256,address,bytes)"))

    constructor() {}

    function swapTokens(address pair, uint256 amount0Out, uint256 amount1Out) public payable {
        assembly {
            let ptr := mload(0x40)

            // Call swap function in pair to proccess exchange
            mstore(ptr, UNISWAP_PAIR_SWAP_SELECTOR)
            mstore(add(ptr, 0x4), amount0Out) // amount0Out
            mstore(add(ptr, 0x24), amount1Out) // amount1Out
            mstore(add(ptr, 0x44), caller()) // to
            mstore(add(ptr, 0x64), 0x80) // data
            if iszero(call(gas(), pair, 0, ptr, 0xA4, 0, 0)) {
                revert(0, returndatasize())
            }
        }
    }

    function withdrawTokens(address token, uint256 amount) public {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, ERC20_TRANSFER_SELECTOR)
            mstore(add(ptr, 0x4), caller()) // to
            mstore(add(ptr, 0x24), amount) // amount
            if iszero(call(gas(), token, 0, ptr, 0x44, 0, 0)) {
                revert(0, 0)
            }
        }
    }
}