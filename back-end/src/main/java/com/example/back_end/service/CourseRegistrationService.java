
package com.example.back_end.service;

import com.example.back_end.dto.response.CourseRegisterResponse;

public interface CourseRegistrationService {

    CourseRegisterResponse registerCourse(Integer courseId);

    CourseRegisterResponse confirmPayment(Integer registrationId);
}
