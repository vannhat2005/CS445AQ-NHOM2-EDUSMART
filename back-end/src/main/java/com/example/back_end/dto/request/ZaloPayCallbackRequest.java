package com.example.back_end.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ZaloPayCallbackRequest {

    private String data;
    private String mac;
    private Integer type;
}