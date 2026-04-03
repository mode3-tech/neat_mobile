import { accountService } from '../account.service';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('accountService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('calls GET /account/summary and unwraps the response', async () => {
      const mockSummary = {
        full_name: 'John Doe',
        account_number: '0123456789',
        available_balance: 250000,
        loan_balance: 45000,
        active_loans: [],
      };

      mockedApi.get.mockResolvedValue({
        data: { status: true, data: mockSummary },
      });

      const result = await accountService.getSummary();

      expect(mockedApi.get).toHaveBeenCalledWith('/account/summary');
      expect(mockedApi.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSummary);
    });

    it('propagates network errors to the caller', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network Error'));

      await expect(accountService.getSummary()).rejects.toThrow('Network Error');
    });
  });
});
