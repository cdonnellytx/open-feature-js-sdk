import { DefaultLogger, SafeLogger } from './logger';
import { NOOP_TRANSACTION_CONTEXT_PROPAGATOR } from './no-op-transaction-context-propagator';
import {
  EvaluationContext,
  Logger,
  ProviderMetadata,
  TransactionContext,
  TransactionContextPropagator,
} from './types';

export abstract class OpenFeatureCommonAPI {
  protected _transactionContextPropagator: TransactionContextPropagator = NOOP_TRANSACTION_CONTEXT_PROPAGATOR;
  protected _context: EvaluationContext = {};
  protected _logger: Logger = new DefaultLogger();

  setLogger(logger: Logger): OpenFeatureCommonAPI {
    this._logger = new SafeLogger(logger);
    return this;
  }

  /**
   * Get metadata about registered provider.
   *
   * @returns {ProviderMetadata} Provider Metadata
   */
  abstract get providerMetadata(): ProviderMetadata;

  setContext(context: EvaluationContext): OpenFeatureCommonAPI {
    this._context = context;
    return this;
  }

  getContext(): EvaluationContext {
    return this._context;
  }

  setTransactionContextPropagator(transactionContextPropagator: TransactionContextPropagator): OpenFeatureCommonAPI {
    const baseMessage = 'Invalid TransactionContextPropagator, will not be set: ';
    if (typeof transactionContextPropagator?.getTransactionContext !== 'function') {
      this._logger.error(`${baseMessage}: getTransactionContext is not a function.`);
    } else if (typeof transactionContextPropagator?.setTransactionContext !== 'function') {
      this._logger.error(`${baseMessage}: setTransactionContext is not a function.`);
    } else {
      this._transactionContextPropagator = transactionContextPropagator;
    }
    return this;
  }

  setTransactionContext<R>(
    transactionContext: TransactionContext,
    callback: (...args: unknown[]) => R,
    ...args: unknown[]
  ): void {
    this._transactionContextPropagator.setTransactionContext(transactionContext, callback, ...args);
  }

  getTransactionContext(): TransactionContext {
    try {
      return this._transactionContextPropagator.getTransactionContext();
    } catch (err: unknown) {
      const error = err as Error | undefined;
      this._logger.error(`Error getting transaction context: ${error?.message}, returning empty context.`);
      this._logger.error(error?.stack);
      return {};
    }
  }
}