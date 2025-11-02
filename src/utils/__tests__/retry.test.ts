import { vi, describe, it, expect, afterEach } from 'vitest';
import { retry, HttpError } from '../../utils';

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

    it('does not retry on 4xx HttpError', async () => {
        const fn = vi.fn().mockRejectedValue(new HttpError(404, 'Not Found'));
        const result = retry(fn, 3, 10);
        await expect(result).rejects.toThrow(HttpError);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on 5xx HttpError', async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new HttpError(502, 'Bad Gateway'))
            .mockResolvedValueOnce('ok');
        const result = await retry(fn, 3, 10);
        expect(result).toBe('ok');
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
