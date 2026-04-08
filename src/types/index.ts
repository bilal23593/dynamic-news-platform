export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export type ActionState<T = Record<string, string[]>> = {
  ok?: boolean;
  message?: string;
  fieldErrors?: T;
};

export type SelectOption = {
  label: string;
  value: string;
};
