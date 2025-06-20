import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { I18nContext, I18nService, I18nTranslation } from 'nestjs-i18n';

const exceptionMap: Record<string, string> = {
  BadRequestException: 'BadRequest',
  UnauthorizedException: 'Unauthorized',
  NotFoundException: 'Not Found',
  ForbiddenException: 'Forbidden',
  NotAcceptableException: 'Not Acceptable',
  RequestTimeoutException: 'Request Timeout',
  ConflictException: 'Conflict',
  GoneException: 'Gone',
  HttpVersionNotSupportedException: 'HTTP Version Not Supported',
  PayloadTooLargeException: 'Payload Too Large',
  UnsupportedMediaTypeException: 'Unsupported Media Type',
  UnprocessableEntityException: 'Unprocessable Entity',
  InternalServerErrorException: 'Internal Server Error',
  NotImplementedException: 'Not Implemented',
  ImATeapotException: "I'm a teapot",
  MethodNotAllowedException: 'Method Not Allowed',
  BadGatewayException: 'Bad Gateway',
  ServiceUnavailableException: 'Service Unavailable',
  GatewayTimeoutException: 'Gateway Timeout',
  PreconditionFailedException: 'Precondition Failed',
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly i18nService: I18nService;

  constructor(i18nService: I18nService) {
    this.i18nService = i18nService;
  }

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    let message = '';

    const i18n = I18nContext.current<I18nTranslation>(host);

    if (exception.message && typeof exception.message === 'string') {
      const defaultMessage = exceptionMap[exception.constructor.name];
      if (exception.message === defaultMessage) {
        try {
          message = await this.i18nService.translate(
            `exceptions.httpExceptions.${exception?.name}`,
            { lang: i18n?.lang },
          );
        } catch (error) {
          console.error(`Error translating exception: ${error}`);
          message = exception.message;
        }
      } else {
        message = exception.message;
      }
    } else {
      message = exception.message;
    }
    const errorResponse: {
      statusCode: number;
      timestamp: string;
      message: string;
      path: string;
    } = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      path: request.url,
    };

    this.logger.error(`Exception caught (status: ${status})`, exception.stack);

    response.status(status).json(errorResponse);
  }
}
