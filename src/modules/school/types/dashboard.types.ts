// ===== src/modules/school/types/dashboard.types.ts =====

export interface DirectionDashboard {
  school: {
    name: string;
    logo_url: string | null;
    academic_year_name: string;
    school_types: string;
  };
  students: {
    total: number;
    active: number;
    by_gender: { male: number; female: number };
    by_category: Record<string, number>;
    new_this_month: number;
    trend: number;
  };
  staff: {
    total: number;
    teachers: number;
    by_role: Record<string, number>;
  };
  academic: {
    classes_count: number;
    subjects_count: number;
    current_period: { id: number; name: string; type: string } | null;
    periods_closed: number;
    periods_total: number;
  };
  attendance: {
    today_rate: number | null;
    week_rate: number;
    at_risk_students: number;
  };
  finance: {
    collection_rate: number;
    total_collected: number;
    total_remaining: number;
    overdue_count: number;
    total_collected_formatted: string;
    total_remaining_formatted: string;
  };
  bulletins: { total: number; published: number; pending: number };
  recent_activity: Array<{ type: string; description: string; created_at: string }>;
  generated_at: string;
  cache_ttl: number;
}

export interface AcademicDashboard {
  period: { id: number; name: string } | null;
  overall: {
    avg_general: number | null;
    passing_rate: number;
    top_classe: { display_name: string; average: number } | null;
    lowest_classe: { display_name: string; average: number } | null;
  };
  by_level: Array<{
    level: { label: string; category: string };
    classes_count: number;
    students_count: number;
    avg_general: number | null;
    passing_rate: number;
  }>;
  by_classe: Array<{
    classe: { id: number; display_name: string };
    students_count: number;
    avg_general: number | null;
    passing_rate: number;
    best_subject: { name: string; average: number } | null;
    worst_subject: { name: string; average: number } | null;
  }>;
  by_subject: Array<{
    subject: { id: number; name: string; code: string; color: string };
    avg: number | null;
    passing_rate: number;
    classes_count: number;
  }>;
  grade_distribution: Record<string, number>;
  evaluations_this_period: number;
  generated_at: string;
}

export interface AttendanceDashboard {
  today: {
    date: string;
    overall_rate: number | null;
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    classes_with_record: number;
    classes_total: number;
  };
  period: {
    avg_rate: number;
    total_absent_hours: number;
    total_excused_hours: number;
    most_absent_class: { display_name: string; rate: number } | null;
    best_class: { display_name: string; rate: number } | null;
  };
  at_risk_students: Array<{
    student: { full_name: string; matricule: string };
    classe: string;
    attendance_rate: number;
    absent_hours: number;
  }>;
  by_day: Array<{ date: string; rate: number | null; recorded: boolean }>;
  by_class: Array<{
    classe: { id: number; display_name: string };
    attendance_rate: number;
    at_risk_count: number;
  }>;
  justifications: { pending: number; approved_this_month: number };
  generated_at: string;
}

export interface FinancialDashboard {
  summary: {
    total_expected: number;
    total_collected: number;
    total_remaining: number;
    total_discounts: number;
    collection_rate: number;
    total_expected_formatted: string;
    total_collected_formatted: string;
    total_remaining_formatted: string;
  };
  by_status: Record<string, { count: number; amount?: number; amount_remaining?: number }>;
  by_fee_type: Array<{
    fee_type: { name: string; code: string };
    expected: number;
    collected: number;
    rate: number;
  }>;
  by_level: Array<{
    level: string;
    expected: number;
    collected: number;
    rate: number;
    students_count: number;
  }>;
  monthly_trend: Array<{ month: string; amount: number; payments_count: number }>;
  by_method: Array<{ method: string; amount: number; count: number; percentage: number }>;
  overdue_students: Array<{
    student: { full_name: string; matricule: string };
    classe: string;
    amount_remaining: number;
    amount_remaining_formatted: string;
    days_overdue: number;
  }>;
  generated_at: string;
}

export interface TeacherDashboard {
  teacher: {
    full_name: string;
    employee_number: string | null;
    weekly_hours: number;
    max_hours: number;
  };
  classes: Array<{
    classe: { id: number; display_name: string };
    subject: { name: string; code: string; color: string };
    students_count: number;
    evaluations_count: number;
    avg_general: number | null;
    passing_rate: number;
    attendance_rate: number;
    next_evaluation: { title: string; date: string } | null;
  }>;
  this_week: {
    courses_count: number;
    total_hours: number;
    schedule: Array<{
      day_label: string;
      time_range: string;
      classe: string;
      subject: string;
      room: string | null;
      is_cancelled: boolean;
    }>;
  };
  recent_grades: Array<{
    evaluation_title: string;
    classe: string;
    date: string;
    avg_score: number | null;
  }>;
  pending_actions: { evaluations_to_lock: number; absences_to_record: number };
  generated_at: string;
}

export interface ReportFilters {
  year_id?: number;
  period_id?: number;
  classe_id?: number;
  level_category?: string;
  status?: string;
  gender?: string;
  date_from?: string;
  date_to?: string;
  method?: string;
}
