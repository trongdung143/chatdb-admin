export const translations = {
    vi: {
        // Header
        admin: "ChatDB Admin",

        // Create/Edit Dialog
        editChatbot: "Chỉnh sửa chatbot",
        createNewChatbot: "Tạo chatbot mới",
        nameRequired: "Tên và email là bắt buộc",
        updateSuccess: "Cập nhật thành công!",
        createSuccess: "Tạo chatbot thành công!",
        cancel: "Hủy",
        savingDots: "Đang lưu...",
        saveChanges: "Lưu thay đổi",
        create: "Tạo",

        // Form Labels
        nameLabel: "Tên *",
        emailLabel: "Email *",
        logoUrlLabel: "URL Logo",
        primaryColorLabel: "Màu chính",
        statusLabel: "Trạng thái",
        descriptionLabel: "Mô tả",
        descriptionPlaceholder: "Mô tả ngắn về chatbot...",

        // Detail Dialog
        detailDescription: "Thông tin chi tiết về chatbot",
        basicInfo: "Thông tin cơ bản",
        email: "Email",
        createdAt: "Tạo lúc",
        updatedAt: "Cập nhật",
        status: "Trạng thái",
        statistics: "Thống kê",
        totalMessages: "Tổng tin nhắn",
        totalErrors: "Tổng lỗi",
        totalCost: "Tổng chi phí",
        avgResponseTime: "Trung bình thời gian phản hồi",
        usageByModel: "Sử dụng theo model",
        model: "Model",
        inputTokens: "Input",
        outputTokens: "Output",
        totalTokens: "Tổng",
        cacheTokens: "Cache",
        edit: "Chỉnh sửa",
        delete: "Xóa",

        // Delete Dialog
        confirmDelete: "Xác nhận xóa",
        deleteConfirmText: "Bạn có chắc muốn xóa",
        deleteSuccess: "Đã xóa chatbot thành công",
        deleteError: "Lỗi xóa: ",
        deletingDots: "Đang xóa...",

        // Table
        statusColumn: "Trạng thái",
        createdColumn: "Tạo lúc",
        actionsColumn: "Hành động",
        searchPlaceholder: "Tìm tên hoặc email...",
        createNew: "+ Tạo mới",

        // Overview
        activeChatbots: "Chatbots hoạt động",
        pendingChatbots: "ChatBots chờ duyệt",
        messagesThisMonth: "Tin nhắn 30 ngày",
        costThisMonth: "Chi phí 30 ngày",

        // Additional
        loading: "Đang tải...",
        details: "Chi tiết",
        viewDetails: "Xem chi tiết",
        noUsageData: "Chưa có dữ liệu sử dụng",
        noChatbots: "Không có chatbot nào",
        pendingApproval: "Đợi xác nhận",
        actualCost: "Chi phí thực",
        billingCost: "Chi phí thanh toán",
        changeTo: "Chuyển →",
        thisActionCannotBeUndone: "Hành động này không thể hoàn tác",
        previous: "← Trước",
        next: "Tiếp →",
        color: "Màu",
        all: "Tất cả",
        search: "Tìm",
        close: "Đóng",
        error: "Lỗi",
    },
    en: {
        // Header
        admin: "ChatDB Admin",

        // Create/Edit Dialog
        editChatbot: "Edit Chatbot",
        createNewChatbot: "Create New Chatbot",
        nameRequired: "Name and email are required",
        updateSuccess: "Updated successfully!",
        createSuccess: "Chatbot created successfully!",
        cancel: "Cancel",
        savingDots: "Saving...",
        saveChanges: "Save Changes",
        create: "Create",

        // Form Labels
        nameLabel: "Name *",
        emailLabel: "Email *",
        logoUrlLabel: "Logo URL",
        primaryColorLabel: "Primary Color",
        statusLabel: "Status",
        descriptionLabel: "Description",
        descriptionPlaceholder: "Brief description of the chatbot...",

        // Detail Dialog
        detailDescription: "Detailed information about the chatbot",
        basicInfo: "Basic Information",
        email: "Email",
        createdAt: "Created At",
        updatedAt: "Updated At",
        status: "Status",
        statistics: "Statistics",
        totalMessages: "Total Messages",
        totalErrors: "Total Errors",
        totalCost: "Total Cost",
        avgResponseTime: "Average Response Time",
        usageByModel: "Usage by Model",
        model: "Model",
        inputTokens: "Input",
        outputTokens: "Output",
        totalTokens: "Total",
        cacheTokens: "Cache",
        edit: "Edit",
        delete: "Delete",

        // Delete Dialog
        confirmDelete: "Confirm Delete",
        deleteConfirmText: "Are you sure you want to delete",
        deleteSuccess: "Chatbot deleted successfully",
        deleteError: "Delete error: ",
        deletingDots: "Deleting...",

        // Table
        statusColumn: "Status",
        createdColumn: "Created At",
        actionsColumn: "Actions",
        searchPlaceholder: "Search by name or email...",
        createNew: "+ Create New",

        // Overview
        activeChatbots: "Active Chatbots",
        pendingChatbots: "Pending Chatbots",
        messagesThisMonth: "Messages (30d)",
        costThisMonth: "Cost (30d)",

        // Additional
        loading: "Loading...",
        details: "Details",
        viewDetails: "View Details",
        noUsageData: "No usage data available",
        noChatbots: "No chatbots found",
        pendingApproval: "Pending approval",
        actualCost: "Actual Cost",
        billingCost: "Billing Cost",
        changeTo: "Change →",
        thisActionCannotBeUndone: "This action cannot be undone",
        previous: "← Previous",
        next: "Next →",
        color: "Color",
        all: "All",
        search: "Search",
        close: "Close",
        error: "Error",
    },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.vi;
