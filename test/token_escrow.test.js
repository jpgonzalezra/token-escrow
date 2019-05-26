const { shouldBehaveLikeTokenEscrow } = require('./token_escrow.behavior');
const { BN, constants, EVMRevert } = require('openzeppelin-test-helpers');
const { expectThrow } = require('./helpers/expect_throw')
const { ZERO_ADDRESS } = constants;

const TokenEscrow = artifacts.require('TokenEscrow');
const StandardToken = artifacts.require('StandardTokenMock');

contract('TokenEscrow', function ([_, primary, ...otherAccounts]) {

  it('reverts when deployed with a null token address', async function () {
    await expectThrow(
      TokenEscrow.new(ZERO_ADDRESS, { from: primary }), EVMRevert
    );
  });

  context('with token', function () {
    beforeEach(async function () {
      this.token = await StandardToken.new({ from: primary });
      this.escrow = await TokenEscrow.new(this.token.address, { from: primary });
    });

    shouldBehaveLikeTokenEscrow(primary, otherAccounts);
  });
});