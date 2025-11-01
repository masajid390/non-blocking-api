import { vi, describe, it, expect, afterEach } from 'vitest';
import { retry } from '../../utils';

describe('retry helper', () => {

    it('resolves on first attempt', async () => {
        const fn = vi.fn().mockResolvedValue('ok');
        const result = await retry(fn, 3, 10);
        expect(result).toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and then succeeds', async () => {

        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error('first'))
            .mockRejectedValueOnce(new Error('second'))
            .mockResolvedValueOnce('done');

        const result = await retry(fn, 3, 100);
        expect(result).toBe('done');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('rejects after exhausting attempts', async () => {

        const fn = vi.fn().mockRejectedValue(new Error('always fail'));
        const result = retry(fn, 2, 50);

        await expect(result).rejects.toThrow('always fail');
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
