import mongoose from 'mongoose';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import WalletTransaction from '../models/WalletTransaction.js';
import logger from '../utils/logger.js';

/**
 * WalletService - Centralized wallet operations
 * All wallet operations are atomic and create transaction logs
 */
class WalletService {
    /**
     * Debit amount from user/scrapper wallet (atomic)
     * @param {String} userId - User or Scrapper ID
     * @param {Number} amount - Amount to debit
     * @param {Object} metadata - Transaction metadata (type, description, orderId, etc.)
     * @param {String} userType - 'user' or 'scrapper'
     * @param {Object} session - MongoDB session for transactions
     * @returns {Object} Updated wallet and transaction record
     */
    async debitWallet(userId, amount, metadata, userType = 'user', session = null) {
        try {
            const Model = userType === 'scrapper' ? Scrapper : User;

            // Atomic debit using $inc
            const updated = await Model.findByIdAndUpdate(
                userId,
                { $inc: { 'wallet.balance': -amount } },
                { new: true, session }
            );

            if (!updated) {
                throw new Error(`${userType} not found`);
            }

            // Create transaction log
            const transaction = await WalletTransaction.create(
                [{
                    [userType]: userId,
                    type: metadata.type || 'debit',
                    amount: -amount,
                    description: metadata.description || 'Wallet debit',
                    orderId: metadata.orderId || null,
                    balanceAfter: updated.wallet.balance,
                    metadata: metadata.additionalData || {}
                }],
                { session }
            );

            logger.info(`Wallet debited: ${userType} ${userId}, amount: ₹${amount}`);

            return {
                wallet: updated.wallet,
                transaction: transaction[0]
            };
        } catch (error) {
            logger.error(`Wallet debit failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Credit amount to user/scrapper wallet (atomic)
     * @param {String} userId - User or Scrapper ID
     * @param {Number} amount - Amount to credit
     * @param {Object} metadata - Transaction metadata
     * @param {String} userType - 'user' or 'scrapper'
     * @param {Object} session - MongoDB session for transactions
     * @returns {Object} Updated wallet and transaction record
     */
    async creditWallet(userId, amount, metadata, userType = 'user', session = null) {
        try {
            const Model = userType === 'scrapper' ? Scrapper : User;

            // Atomic credit using $inc
            const updated = await Model.findByIdAndUpdate(
                userId,
                { $inc: { 'wallet.balance': amount } },
                { new: true, session }
            );

            if (!updated) {
                throw new Error(`${userType} not found`);
            }

            // Create transaction log
            const transaction = await WalletTransaction.create(
                [{
                    [userType]: userId,
                    type: metadata.type || 'credit',
                    amount: amount,
                    description: metadata.description || 'Wallet credit',
                    orderId: metadata.orderId || null,
                    balanceAfter: updated.wallet.balance,
                    metadata: metadata.additionalData || {}
                }],
                { session }
            );

            logger.info(`Wallet credited: ${userType} ${userId}, amount: ₹${amount}`);

            return {
                wallet: updated.wallet,
                transaction: transaction[0]
            };
        } catch (error) {
            logger.error(`Wallet credit failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get current wallet balance
     * @param {String} userId - User or Scrapper ID
     * @param {String} userType - 'user' or 'scrapper'
     * @returns {Number} Current balance
     */
    async getBalance(userId, userType = 'user') {
        const Model = userType === 'scrapper' ? Scrapper : User;
        const user = await Model.findById(userId).select('wallet.balance');

        if (!user) {
            throw new Error(`${userType} not found`);
        }

        return user.wallet.balance;
    }

    /**
     * Validate if user has sufficient balance
     * @param {String} userId - User or Scrapper ID
     * @param {Number} minimumAmount - Minimum required amount
     * @param {String} userType - 'user' or 'scrapper'
     * @returns {Boolean} True if sufficient, throws error otherwise
     */
    async validateBalance(userId, minimumAmount, userType = 'user') {
        const balance = await this.getBalance(userId, userType);

        if (balance < minimumAmount) {
            throw new Error(`Insufficient wallet balance. Required: ₹${minimumAmount}, Available: ₹${balance}`);
        }

        return true;
    }

    /**
     * Transfer amount between wallets (atomic transaction)
     * @param {String} fromId - Source user/scrapper ID
     * @param {String} toId - Destination user/scrapper ID
     * @param {Number} amount - Amount to transfer
     * @param {Object} metadata - Transaction metadata
     * @param {String} fromType - 'user' or 'scrapper'
     * @param {String} toType - 'user' or 'scrapper'
     * @returns {Object} Both transaction records
     */
    async transfer(fromId, toId, amount, metadata, fromType = 'user', toType = 'scrapper') {
        const session = await mongoose.startSession();

        try {
            return await session.withTransaction(async () => {
                // Debit from source
                const debitResult = await this.debitWallet(
                    fromId,
                    amount,
                    {
                        ...metadata,
                        description: metadata.debitDescription || `Transfer to ${toType}`
                    },
                    fromType,
                    session
                );

                // Credit to destination
                const creditResult = await this.creditWallet(
                    toId,
                    amount,
                    {
                        ...metadata,
                        description: metadata.creditDescription || `Transfer from ${fromType}`
                    },
                    toType,
                    session
                );

                logger.info(`Wallet transfer: ${fromType} ${fromId} → ${toType} ${toId}, amount: ₹${amount}`);

                return {
                    debit: debitResult,
                    credit: creditResult
                };
            });
        } finally {
            session.endSession();
        }
    }
}

export default new WalletService();
