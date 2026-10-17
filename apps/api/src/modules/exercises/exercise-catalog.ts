import type { Exercise } from '@flowment/domain';

const traceFileUpload: Exercise = {
  id: 'trace-file-upload',
  title: 'Trace a background file upload',
  difficulty: 1,
  mode: 'trace',
  prompt:
    'A user uploads a CSV file that is processed in the background. Using the given components, write the sequence for a successful upload, from the upload request until the job is marked done.',
  learningObjectives: [
    {
      id: 'upload-accepted-early',
      description:
        'The Client is told the upload was accepted without waiting for the file to be processed.',
    },
    {
      id: 'worker-finds-file',
      description:
        "The Worker obtains the file's storage location before it reads the file.",
    },
    {
      id: 'job-done-after-processing',
      description:
        'The job is marked done only after the file has been processed.',
    },
  ],
  startingDesign: {
    components: [
      { id: 'client', name: 'Client', kind: 'client' },
      {
        id: 'api',
        name: 'API',
        kind: 'service',
        responsibility: 'Accepts uploads and records jobs',
      },
      {
        id: 'file-storage',
        name: 'File Storage',
        kind: 'storage',
        responsibility: 'Stores uploaded files',
      },
      {
        id: 'job-db',
        name: 'Job DB',
        kind: 'database',
        responsibility: 'Stores jobs and their status',
      },
      {
        id: 'queue',
        name: 'Queue',
        kind: 'queue',
        responsibility: 'Delivers job ids to workers',
      },
      {
        id: 'worker',
        name: 'Worker',
        kind: 'service',
        responsibility: 'Processes uploaded files',
      },
    ],
    scenarios: [
      {
        id: 'successful-upload',
        title: 'Successful upload',
        description:
          'A user uploads a CSV file. The upload is accepted right away, and the file is processed in the background until its job is marked done.',
        steps: [],
      },
    ],
    assumptions: [],
  },
};

const completeMonthlyReport: Exercise = {
  id: 'complete-monthly-report',
  title: 'Complete a monthly report job',
  difficulty: 1,
  mode: 'complete',
  prompt:
    'This sequence builds a monthly report in the background, but one step is missing where the note says so. Fill the gap so that every component has what it needs when it acts, then remove the note.',
  learningObjectives: [
    {
      id: 'worker-learns-month',
      description:
        'Before writing the report, the Worker obtains which month to report on, using only information it already has at that point.',
    },
  ],
  startingDesign: {
    components: [
      { id: 'client', name: 'Client', kind: 'client' },
      { id: 'api', name: 'API', kind: 'service' },
      { id: 'report-db', name: 'Report DB', kind: 'database' },
      { id: 'queue', name: 'Queue', kind: 'queue' },
      { id: 'worker', name: 'Worker', kind: 'service' },
      { id: 'report-storage', name: 'Report Storage', kind: 'storage' },
    ],
    scenarios: [
      {
        id: 'report-ready',
        title: 'Report is generated',
        description:
          'A user requests the report for March and it is generated in the background.',
        steps: [
          {
            id: 'request-report',
            type: 'interaction',
            from: 'client',
            to: 'api',
            text: 'Request report for March',
          },
          {
            id: 'create-request',
            type: 'interaction',
            from: 'api',
            to: 'report-db',
            text: 'Create report request (reportId, month)',
          },
          {
            id: 'publish-report-id',
            type: 'interaction',
            from: 'api',
            to: 'queue',
            text: 'Publish reportId',
          },
          {
            id: 'accept-request',
            type: 'interaction',
            from: 'api',
            to: 'client',
            text: '202 Accepted (reportId)',
          },
          {
            id: 'deliver-report-id',
            type: 'interaction',
            from: 'queue',
            to: 'worker',
            text: 'Deliver reportId',
          },
          {
            id: 'missing-step',
            type: 'note',
            componentId: 'worker',
            text: '[MISSING STEP]',
          },
          {
            id: 'write-report',
            type: 'interaction',
            from: 'worker',
            to: 'report-storage',
            text: 'Write report for March',
          },
          {
            id: 'mark-ready',
            type: 'interaction',
            from: 'worker',
            to: 'report-db',
            text: 'Mark report ready (file location)',
          },
        ],
      },
    ],
    assumptions: [],
  },
};

const repairEarlyPaidOrder: Exercise = {
  id: 'repair-early-paid-order',
  title: 'Repair an order marked paid too early',
  difficulty: 2,
  mode: 'repair',
  prompt:
    'Customers whose card is declined end up with orders marked as paid. Find the flaw in the checkout sequences and fix it.',
  learningObjectives: [
    {
      id: 'paid-after-charge',
      description:
        'In every scenario, the order is marked paid only after the Payment Provider confirms the charge, so a declined card never leaves a paid order.',
    },
  ],
  startingDesign: {
    components: [
      { id: 'client', name: 'Client', kind: 'client' },
      { id: 'checkout-api', name: 'Checkout API', kind: 'service' },
      { id: 'orders-db', name: 'Orders DB', kind: 'database' },
      {
        id: 'payment-provider',
        name: 'Payment Provider',
        kind: 'external-system',
      },
    ],
    scenarios: [
      {
        id: 'payment-succeeds',
        title: 'Payment succeeds',
        steps: [
          {
            id: 'place-order',
            type: 'interaction',
            from: 'client',
            to: 'checkout-api',
            text: 'Place order (cart, card token)',
          },
          {
            id: 'create-order',
            type: 'interaction',
            from: 'checkout-api',
            to: 'orders-db',
            text: 'Create order (status: pending)',
          },
          {
            id: 'mark-paid',
            type: 'interaction',
            from: 'checkout-api',
            to: 'orders-db',
            text: 'Mark order paid',
          },
          {
            id: 'charge-card',
            type: 'interaction',
            from: 'checkout-api',
            to: 'payment-provider',
            text: 'Charge card (amount, card token)',
          },
          {
            id: 'charge-succeeded',
            type: 'interaction',
            from: 'payment-provider',
            to: 'checkout-api',
            text: 'Charge succeeded',
          },
          {
            id: 'confirm-order',
            type: 'interaction',
            from: 'checkout-api',
            to: 'client',
            text: 'Order confirmed',
          },
        ],
      },
      {
        id: 'card-declined',
        title: 'Card is declined',
        description: 'The payment provider declines the card.',
        steps: [
          {
            id: 'place-order',
            type: 'interaction',
            from: 'client',
            to: 'checkout-api',
            text: 'Place order (cart, card token)',
          },
          {
            id: 'create-order',
            type: 'interaction',
            from: 'checkout-api',
            to: 'orders-db',
            text: 'Create order (status: pending)',
          },
          {
            id: 'mark-paid',
            type: 'interaction',
            from: 'checkout-api',
            to: 'orders-db',
            text: 'Mark order paid',
          },
          {
            id: 'charge-card',
            type: 'interaction',
            from: 'checkout-api',
            to: 'payment-provider',
            text: 'Charge card (amount, card token)',
          },
          {
            id: 'charge-declined',
            type: 'interaction',
            from: 'payment-provider',
            to: 'checkout-api',
            text: 'Charge declined',
          },
          {
            id: 'report-failure',
            type: 'interaction',
            from: 'checkout-api',
            to: 'client',
            text: 'Payment failed',
          },
        ],
      },
    ],
    assumptions: [],
  },
};

export const EXERCISE_CATALOG: readonly Exercise[] = [
  traceFileUpload,
  completeMonthlyReport,
  repairEarlyPaidOrder,
];
