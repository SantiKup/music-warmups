import { authClient } from "~~/lib/auth-client";

export interface StudentSelection {
  style: string | null;
  instrument: string | null;
  difficulty: string | null;
}

type StudentSelectionField = keyof StudentSelection;

export function useBandJamState() {
  const studentSelection = useState<StudentSelection>(
    "bandjam-student-selection",
    () => ({
      style: null,
      instrument: null,
      difficulty: null,
    }),
  );

  const isTeacherAuthenticated = computed(
    () => !!authClient.useSession().value?.data?.user,
  );

  const selectionReady = computed(() => {
    return Boolean(
      studentSelection.value.style && studentSelection.value.instrument,
    );
  });

  const setStudentField = <K extends StudentSelectionField>(
    field: K,
    value: StudentSelection[K],
  ) => {
    studentSelection.value = {
      ...studentSelection.value,
      [field]: value,
    };
  };

  const resetStudentSelection = () => {
    studentSelection.value = {
      style: null,
      instrument: null,
      difficulty: null,
    };
  };

  return {
    studentSelection,
    selectionReady,
    setStudentField,
    resetStudentSelection,
    isTeacherAuthenticated,
  };
}
