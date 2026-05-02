const { authValidation, sanitizeJobData, sanitizeBookingData } = require('../../middleware/validation');

describe('Validation Middleware', () => {
    describe('Field Sanitization', () => {
        test('sanitizeJobData should only allow specific fields', () => {
            const input = {
                jobTitle: 'Fix Faucet',
                jobDescription: 'Fix leaky faucet',
                category: 'plumbing',
                customer: 'hacker_id',
                timestamps: 'fake',
                budgetMin: 1000
            };

            const result = sanitizeJobData(input);

            expect(result.jobTitle).toBe('Fix Faucet');
            expect(result.customer).toBeUndefined();
            expect(result.timestamps).toBeUndefined();
        });

        test('sanitizeBookingData should only allow specific fields', () => {
            const input = {
                worker: 'worker_id',
                job: 'job_id',
                scheduledDate: new Date(),
                customer: 'hacker_id',
                paymentStatus: 'paid'
            };

            const result = sanitizeBookingData(input);

            expect(result.worker).toBe('worker_id');
            expect(result.customer).toBeUndefined();
            expect(result.paymentStatus).toBeUndefined();
        });
    });
});
