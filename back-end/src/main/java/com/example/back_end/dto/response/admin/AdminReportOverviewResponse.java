package com.example.back_end.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportOverviewResponse {

    private KpiStats kpi;
    private RevenueChartData revenueChart;
    private CategoryDistribution categoryDistribution;
    private UserGrowthChart userGrowthChart;
    private List<TopEnrolledCourse> topEnrolledCourses;
    private List<TopRevenueCourse> topRevenueCourses;
    private List<TopInstructor> topInstructors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiStats {
        private BigDecimal totalRevenue;
        private Double revenueGrowthRate;
        private Long totalTransactions;
        private Long successTransactions;
        private Long pendingTransactions;
        private Long failedTransactions;
        private Long totalUsers;
        private Long instructorCount;
        private Long studentCount;
        private Long publishedCourses;
        private Long categoryCount;
        private Double activeCourseRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueChartData {
        private String granularity; // day, week, month, custom
        private String badgeText;
        private BigDecimal maxScale;
        private List<RevenueBarItem> bars;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueBarItem {
        private String label; // "Tuần 1", "01/10", "Tháng 1"
        private BigDecimal amount;
        private String formattedAmount; // "85tr"
        private Double heightPercent; // 0 - 100
        private boolean isCurrentOrProjected;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryDistribution {
        private Long totalStudents;
        private Integer categoryCount;
        private List<CategoryStatItem> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryStatItem {
        private Integer categoryId;
        private String name;
        private Long studentCount;
        private Double percentage;
        private String color; // hex code
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserGrowthChart {
        private Long studentGrowth;
        private Long instructorGrowth;
        private List<UserGrowthPoint> points;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserGrowthPoint {
        private String dateLabel; // "01/10", "Hôm nay"
        private Long students;
        private Long instructors;
        private Double studentY; // SVG coordinate
        private Double instructorY;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopEnrolledCourse {
        private Integer courseId;
        private Integer rank;
        private String title;
        private Long enrollments;
        private Double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopRevenueCourse {
        private Integer courseId;
        private Integer rank;
        private String title;
        private String categoryName;
        private BigDecimal revenue;
        private String formattedRevenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopInstructor {
        private Integer instructorId;
        private Integer rank;
        private String fullName;
        private String avatarUrl;
        private boolean verified;
        private Long courseCount;
        private Long studentCount;
        private Double rating;
    }
}
