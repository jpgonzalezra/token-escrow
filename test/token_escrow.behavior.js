const { BN, constants, expectEvent, EVMRevert, expectRevert } = require('openzeppelin-test-helpers');
const { expectThrow } = require('./helpers/expect_throw')
const { MAX_UINT256 } = constants;

require('chai')
  .use(require('chai-bignumber')(BN))
  .should();

//TODO: REMOVE .toNumber() -> use .should.be.bignumber
function shouldBehaveLikeTokenEscrow (primary, [payee1, payee2, payee3]) {
  const amount = new BN(100);

  it('stores the token\'s address', async function () {
    const address = await this.escrow.token();
    const primaryAddress = await this.escrow.primary();
    primaryAddress.should.be.equal(primary);
    address.should.be.equal(this.token.address);
  });

  context('when not approved by payer', function () {
    it('reverts on deposits', async function () {
      await expectThrow(
        this.escrow.deposit(payee1, amount, { from: primary }),
        EVMRevert
      );
    });
  });

  context('when approved by payer', function () {
    beforeEach(async function () {
      this.token.approve(this.escrow.address, MAX_UINT256, { from: primary });
    });

    describe('deposits', function () {
      it('accepts a single deposit', async function () {
        await this.escrow.deposit(payee3, amount, { from: primary });
        (await this.token.balanceOf(this.escrow.address)).toNumber().should.be.equal(amount.toNumber());
        (await this.escrow.depositsOf(payee3)).toNumber().should.be.equal(amount.toNumber());
      });

      it('accepts an empty deposit', async function () {
        await this.escrow.deposit(payee1, new BN(0), { from: primary });
      });

      it('reverts when non-primary deposit', async function () {
        await expectThrow(this.escrow.deposit(payee1, amount, { from: payee2 }), EVMRevert);
      });

      it('emits a deposited event', async function () {
        const receipt = await this.escrow.deposit(payee1, amount, { from: primary });

        const event = expectEvent.inLogs(receipt.logs, 'Deposited', { payee: payee1 });
        event.args.tokenAmount.toNumber().should.be.equal(amount.toNumber());
      });

      it('adds multiple deposits on a single account', async function () {
        await this.escrow.deposit(payee1, amount, { from: primary });
        await this.escrow.deposit(payee1, amount * 2, { from: primary });

        const expected = amount.toNumber() * 3;
        (await this.token.balanceOf(this.escrow.address)).toNumber().should.be.equal(expected);
        (await this.escrow.depositsOf(payee1)).toNumber().should.be.equal(expected);
      });

      it('tracks deposits to multiple accounts', async function () {
        await this.escrow.deposit(payee1, amount, { from: primary });
        await this.escrow.deposit(payee2, amount * 2, { from: primary });

        (await this.escrow.depositsOf(payee1)).toNumber().should.be.equal(amount.toNumber());
        (await this.escrow.depositsOf(payee2)).toNumber().should.be.equal(amount.toNumber() * 2);
        (await this.token.balanceOf(this.escrow.address)).toNumber().should.be.equal(amount.toNumber() * 3);
      });
    });

    context('with deposit', function () {
      beforeEach(async function () {
        await this.escrow.deposit(payee1, amount, { from: primary });
      });

      describe('withdrawals', function () {
        it('withdraws payments', async function () {
          const payeeInitialBalance = await this.token.balanceOf(payee1);

          await this.escrow.withdraw(payee1, { from: primary });

          const expected = new BN(0);
          (await this.token.balanceOf(this.escrow.address)).toNumber().should.be.equal(expected.toNumber());
          (await this.escrow.depositsOf(payee1)).toNumber().should.be.equal(expected.toNumber())

          const payeeFinalBalance = await this.token.balanceOf(payee1);
          payeeFinalBalance.sub(payeeInitialBalance).toNumber().should.be.equal(amount.toNumber());
        });

        it('accepts empty withdrawal', async function () {
          await this.escrow.withdraw(payee1, { from: primary });

          (await this.escrow.depositsOf(payee1)).toNumber().should.be.equal(0);

          await this.escrow.withdraw(payee1, { from: primary });
        });

        it('reverts when non-primary withdraw', async function () {
          await expectThrow(this.escrow.withdraw(payee1, { from: payee1 }), EVMRevert);
        });

        it('emits a withdrawn event', async function () {
          const receipt = await this.escrow.withdraw(payee1, { from: primary });

          const event = expectEvent.inLogs(receipt.logs, 'Withdrawn', { payee: payee1 });
          event.args.tokenAmount.toNumber().should.be.equal(amount.toNumber());
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeTokenEscrow,
};