# KYC Integration Hub: Flutter to Backend Bridge

This document provides the exact technical specifications for the Flutter developer to implement the KYC upload feature.

## 1. Primary KYC Endpoint

- **URL**: `POST /api/kyc`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Authentication**: `Authorization: Bearer <TOKEN>`

## 2. Request Structure (Multipart Fields)

| Field Name | Type | Category | Mandatory | Description |
| :--- | :--- | :--- | :--- | :--- |
| `aadhaar` | File (img/pdf) | Document | Yes | Physical photo of Aadhaar Card |
| `selfie` | File (img) | Photo | Yes | Live selfie of the user |
| `pan` | File (img) | Document | No | Photo of PAN Card |
| `shopLicense` | File (img/pdf) | Legal | No | Shop/Business license |
| `shopPhoto` | File (img) | Photo | Role Dep. | Physical shop photo (Mandatory for Dukandaar) |
| `gstCertificate` | File (img/pdf) | Legal | Role Dep. | GST Cert (Mandatory for Wholesaler/Industrial) |
| `aadhaarNumber` | String | Data | Yes | 12-digit Aadhaar Number |
| `panNumber` | String | Data | No | PAN Number |
| `gstNumber` | String | Data | No | GST Number |

## 3. Implementation Blueprint (Flutter/Dart)

Using the `dio` package (recommended for multi-part requests):

```dart
import 'package:dio/dio.dart';

Future<void> uploadKYC({
  required String token,
  required String aadhaarNumber,
  String? aadhaarPath,
  String? selfiePath,
  // Add other optional paths...
}) async {
  Dio dio = Dio();
  
  // Set Authorization Header
  dio.options.headers["Authorization"] = "Bearer $token";

  // Prepare Multipart Data
  FormData formData = FormData.fromMap({
    "aadhaarNumber": aadhaarNumber,
    if (aadhaarPath != null) 
      "aadhaar": await MultipartFile.fromFile(aadhaarPath, filename: "aadhaar.jpg"),
    if (selfiePath != null)
      "selfie": await MultipartFile.fromFile(selfiePath, filename: "selfie.jpg"),
    // Add other fields similarly...
  });

  try {
    Response response = await dio.post("https://YOUR_API_DOMAIN/api/kyc", data: formData);
    print("KYC Success: ${response.data}");
  } on DioException catch (e) {
    print("KYC Error: ${e.response?.data ?? e.message}");
  }
}
```

## 4. Troubleshooting Guide for Developers

- **Camera clicking but not upload?** Ensure you are calling the endpoint *after* the photo is saved locally.
- **400 Bad Request?** This usually means a mandatory field (Aadhaar/Selfie) is missing in the request.
- **Unauthorized?** Ensure the `Bearer <token>` is correctly attached and the user has the `scrapper` role.
- **Size Limit**: Stay under 15MB per file.
