
package com.example.back_end.service;

import com.example.back_end.dto.request.AccountRequest;
import com.example.back_end.dto.response.AccountResponse;
import com.example.back_end.dto.response.AccountStatisticsResponse;
import com.example.back_end.enumType.AccountStatus;
import org.springframework.data.domain.Page;

public interface AccountService {

    Page<AccountResponse> getAccounts(
            String keyword,
            AccountStatus status,
            int pageNo,
            int pageSize
    );

    AccountResponse getAccount(Integer userId);

    AccountStatisticsResponse getStatistics();

    AccountResponse createAccount(AccountRequest request);

    AccountResponse updateAccount(Integer userId, AccountRequest request);
}
