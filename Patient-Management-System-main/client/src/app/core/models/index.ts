export interface ApiResponse<T> {
  success: boolean;
  data?: T; // present when success = true
  message?: string; // present when success = false
}

// const models = {
//   ApiResponse<T>
// };
