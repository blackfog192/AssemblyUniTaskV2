
const { expect } = require("chai");
const { loadFixture, } = require("@nomicfoundation/hardhat-toolbox/network-helpers");


describe("Uniswapper", function () {
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const Router = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";

  async function deploySwapFixture() {
    const swapper = await ethers.deployContract("UniSwapper");

    // give contract WETH for test 
    const iWETH = await ethers.getContractAt("IWETH", WETH);
    await iWETH.deposit({value: ethers.parseEther("500")});
  
    return { swapper, iWETH };
  }

  describe("Swap", function () {
    it("Caller must get amountToBuy of tokenToBuy", async function() {
      const { swapper, } = await loadFixture(deploySwapFixture);

      const pairAddress = "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"; // WETH - USDT
      const amountToBuy = 200000;
      const tokenToBuy = USDT;

      const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress);
      const router = await ethers.getContractAt("IUniswapV2Router", Router);

      const token0 = await pair.token0();
      const token1 = await pair.token1();

      var path = [];
      var reverse = false;
      if(tokenToBuy == token0) {
        path = [token1, token0];
        reverse = true;
      } else path = [token0, token1];

      var amountsIn = await router.getAmountsIn(amountToBuy, [path[0], path[1]]);
      var tokenIn = await ethers.getContractAt("IERC20", path[0]);

      await expect(tokenIn.transfer(pairAddress, amountsIn[0])).to.changeTokenBalance(
        tokenIn,
        pair,
        amountsIn[0]
      );

      var amount0Out = reverse ? amountToBuy : 0;
      var amount1Out = reverse ? 0 : amountToBuy;
      
      await swapper.swapTokens(pairAddress, amount0Out, amount1Out);
      
      // second swap
      amountsIn = await router.getAmountsIn(amountToBuy, [path[0], path[1]]);
      tokenIn = await ethers.getContractAt("IERC20", path[0]);
      tokenOut = await ethers.getContractAt("IERC20", tokenToBuy);

      await expect(tokenIn.transfer(pairAddress, amountsIn[0])).to.changeTokenBalance(
        tokenIn,
        pair,
        amountsIn[0]
      );

      amount0Out = reverse ? amountToBuy : 0;
      amount1Out = reverse ? 0 : amountToBuy;
      
      const [user] = await ethers.getSigners();
      await expect(swapper.swapTokens(pairAddress, amount0Out, amount1Out)).to.changeTokenBalance(
        tokenOut,
        user,
        amountToBuy
      );
      
      /* const iUSDT = await ethers.getContractAt("IWETH", USDT);
      await expect(swapper.swapTokens(payload)).to.changeTokenBalance(
        iUSDT,
        swapper,
        buyAmount
      ); */
    });
  });

  describe("Withdraw", function () {
    it("Tokens must be transfered to msg.sender", async function () {
      const { swapper, iWETH } = await loadFixture(deploySwapFixture);

      const [user] = await ethers.getSigners();
      await iWETH.transfer(swapper, ethers.parseEther("10"));
      await expect(swapper.withdrawTokens(WETH, ethers.parseEther("10"))).to.changeTokenBalance(
        iWETH,
        user,
        ethers.parseEther("10")
      );
    });
  });
});
