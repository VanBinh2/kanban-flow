import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// --- Resources (Typically split into separate JSON files in locales/en/translation.json) ---

const resources = {
  en: {
    translation: {
      auth: {
        welcome_back: "Welcome back",
        start_journey: "Start your journey",
        create_account: "Create Account",
        sign_in: "Sign In",
        already_member: "Already a member? Log in",
        new_here: "New here? Create account",
        full_name: "Full Name",
        email: "Email",
        password: "Password",
        auth_failed: "Authentication failed",
        loading: "Loading..."
      },
      board: {
        workspace: "Workspace",
        active: "Active",
        search_placeholder: "Search...",
        search_tasks: "Search tasks...",
        filter: "Filter",
        clear_filters: "Clear Filters",
        filter_options: "Filter Options",
        reset_default: "Reset to Default",
        new_task: "New Task",
        add_list: "Add List",
        enter_list_title: "Enter list title...",
        add_another_list: "Add another list",
        primary_project: "Primary Project",
        view_info: "Board View",
        create_new_task: "Create New Task",
        select_list: "Select List",
        task_title: "Task Title",
        shortcut_hint: "Press Ctrl+N to create a task"
      },
      card: {
        description: "Description",
        activity: "Activity",
        checklist: "Checklist",
        members: "Members",
        assign_members: "Assign Members",
        labels: "Labels",
        colors: "Colors",
        dates: "Dates",
        select_date: "Select Date",
        remove_date: "Remove Due Date",
        delete_card: "Delete Card",
        duplicate_card: "Duplicate Task",
        copy_suffix: "(Copy)",
        write: "Write",
        preview: "Preview",
        save_changes: "Save Changes",
        cancel: "Cancel",
        add_item: "Add an item...",
        write_comment: "Write a comment...",
        send: "Send",
        no_activity: "No activity yet. Be the first to comment!",
        markdown_supported: "Markdown Supported",
        add_to_card: "ADD TO CARD",
        actions: "ACTIONS",
        in_list: "in list",
        overdue: "OVERDUE",
        completed: "completed"
      },
      common: {
        confirm_delete: "Delete?",
        error_server: "Server error",
        error_permission: "Access Denied"
      },
      sidebar: {
        menu: "Menu",
        boards: "Boards",
        members: "Members",
        updates: "Updates",
        settings: "Settings"
      },
      filter: {
        assignees: "Assignees",
        due_next_week: "Due in the next week",
        deadlines: "Deadlines"
      }
    }
  },
  vi: {
    translation: {
      auth: {
        welcome_back: "Chào mừng trở lại",
        start_journey: "Bắt đầu hành trình",
        create_account: "Đăng ký",
        sign_in: "Đăng nhập",
        already_member: "Đã có tài khoản? Đăng nhập",
        new_here: "Chưa có tài khoản? Đăng ký ngay",
        full_name: "Họ và tên",
        email: "Email",
        password: "Mật khẩu",
        auth_failed: "Xác thực thất bại",
        loading: "Đang xử lý..."
      },
      board: {
        workspace: "Không gian làm việc",
        active: "Hoạt động",
        search_placeholder: "Tìm kiếm...",
        search_tasks: "Tìm công việc...",
        filter: "Bộ lọc",
        clear_filters: "Xóa bộ lọc",
        filter_options: "Tùy chọn lọc",
        reset_default: "Về mặc định",
        new_task: "Thêm thẻ mới",
        add_list: "Thêm danh sách",
        enter_list_title: "Nhập tên danh sách...",
        add_another_list: "Thêm danh sách khác",
        primary_project: "Dự án chính",
        view_info: "Dạng Bảng",
        create_new_task: "Tạo công việc mới",
        select_list: "Chọn danh sách",
        task_title: "Tiêu đề công việc",
        shortcut_hint: "Nhấn Ctrl+N để tạo nhanh"
      },
      card: {
        description: "Mô tả",
        activity: "Hoạt động",
        checklist: "Danh sách việc",
        members: "Thành viên",
        assign_members: "Gán thành viên",
        labels: "Nhãn",
        colors: "Màu sắc",
        dates: "Ngày hạn",
        select_date: "Chọn ngày",
        remove_date: "Gỡ ngày hạn",
        delete_card: "Xóa thẻ",
        duplicate_card: "Sao chép thẻ",
        copy_suffix: "(Sao chép)",
        write: "Viết",
        preview: "Xem trước",
        save_changes: "Lưu thay đổi",
        cancel: "Hủy",
        add_item: "Thêm mục mới...",
        write_comment: "Viết bình luận...",
        send: "Gửi",
        no_activity: "Chưa có hoạt động. Hãy là người đầu tiên bình luận!",
        markdown_supported: "Hỗ trợ Markdown",
        add_to_card: "THÊM VÀO THẺ",
        actions: "THAO TÁC",
        in_list: "trong danh sách",
        overdue: "QUÁ HẠN",
        completed: "hoàn thành"
      },
      common: {
        confirm_delete: "Bạn chắc chắn muốn xóa?",
        error_server: "Lỗi máy chủ",
        error_permission: "Từ chối truy cập"
      },
      sidebar: {
        menu: "Danh mục",
        boards: "Bảng tin",
        members: "Thành viên",
        updates: "Cập nhật",
        settings: "Cài đặt"
      },
      filter: {
        assignees: "Người thực hiện",
        due_next_week: "Hết hạn tuần tới",
        deadlines: "Thời hạn"
      }
    }
  }
};

// Get stored language or default to 'en'
const storedLang = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already safes from xss
    }
  });

export default i18n;
