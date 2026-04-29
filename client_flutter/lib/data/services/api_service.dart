import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'package:neochat/core/constants/app_constants.dart';
import 'package:neochat/core/utils/logger.dart';
import 'package:neochat/data/models/common.dart';

class ApiService {
  final Dio _dio;
  String? _accessToken;
  String? _refreshToken;
  Function? _onTokenRefresh;
  Function? _onUnauthorized;

  ApiService({String baseUrl = AppConstants.defaultBaseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: '$baseUrl/${AppConstants.apiVersion}',
          connectTimeout: AppConstants.connectTimeout,
          receiveTimeout: AppConstants.receiveTimeout,
          headers: {
            'Content-Type': 'application/json',
          },
        )) {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(PrettyDioLogger(
      requestHeader: true,
      requestBody: true,
      responseHeader: true,
      responseBody: true,
      error: true,
      compact: true,
      maxWidth: 90,
      logPrint: (object) => Logger.debug(object.toString(), tag: 'API'),
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_accessToken != null) {
          options.headers['Authorization'] = 'Bearer $_accessToken';
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401 && _refreshToken != null) {
          try {
            if (_onTokenRefresh != null) {
              await _onTokenRefresh!();
              final request = error.requestOptions;
              if (_accessToken != null) {
                request.headers['Authorization'] = 'Bearer $_accessToken';
              }
              final response = await _dio.fetch(request);
              return handler.resolve(response);
            }
          } catch (e) {
            _onUnauthorized?.call();
            return handler.reject(error);
          }
        }
        return handler.next(error);
      },
    ));
  }

  void setTokens(String accessToken, String refreshToken) {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
  }

  void clearTokens() {
    _accessToken = null;
    _refreshToken = null;
  }

  void setOnTokenRefresh(Function callback) {
    _onTokenRefresh = callback;
  }

  void setOnUnauthorized(Function callback) {
    _onUnauthorized = callback;
  }

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.get(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.post(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.put(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.patch(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.delete(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response> uploadFile(
    String path,
    MultipartFile file, {
    Function(int, int)? onSendProgress,
    Map<String, dynamic>? data,
  }) async {
    final formData = FormData.fromMap({
      'file': file,
      if (data != null) ...data,
    });

    return await _dio.post(
      path,
      data: formData,
      options: Options(
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      ),
      onSendProgress: onSendProgress,
    );
  }

  String? getAccessToken() {
    return _accessToken;
  }

  String? getRefreshToken() {
    return _refreshToken;
  }
}
