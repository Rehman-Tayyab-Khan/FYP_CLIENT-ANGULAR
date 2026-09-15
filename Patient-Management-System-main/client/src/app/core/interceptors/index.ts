import { apiResponseInterceptor } from './api-response.interceptor';
import { credentialsInterceptor } from './credentials.interceptor';

const interceptors = {
  credentialsInterceptor,
  apiResponseInterceptor,
};

export { credentialsInterceptor, apiResponseInterceptor };
export default interceptors;
