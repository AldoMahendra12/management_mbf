import React from 'react';
import { EggTransactionModal } from './EggTransactionModal';
import { FeedTransactionModal } from './FeedTransactionModal';
import { PopulationModal } from './PopulationModal';
import { EggDetailModal } from './EggDetailModal';
import { FeedDetailModal } from './FeedDetailModal';
import { PaymentModal } from './PaymentModal';
import { ConfirmModal } from './ConfirmModal';

export const ModalOrchestrator: React.FC = () => {
  return (
    <>
      <EggTransactionModal />
      <FeedTransactionModal />
      <PopulationModal />
      <EggDetailModal />
      <FeedDetailModal />
      <PaymentModal />
      <ConfirmModal />
    </>
  );
};
