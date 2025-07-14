# Hướng dẫn tạo và deploy PCF Control cho Power Apps

## 1. Tạo PCF Control mới
```sh
pac pcf init --namespace CustomComponent --name PrintForm --template dataset
cd IconFontAwesome
npm install
```

## 2. Phát triển control
- Sửa file `index.ts` để hiện Formin theo ý muốn.
- Sửa file `ControlManifest.Input.xml` để khai báo các property cần thiết.

## 3. Build PCF Control
```sh
npm run build
```

## 4. Tạo Solution Dataverse (nếu chưa có)
```sh
cd ..
pac solution init --publisher-name <TênPublisher> --publisher-prefix <Prefix>
cd Solutions
```
Ví dụ:
```sh
pac solution init --publisher-name Crda32e --publisher-prefix crdfd
```

## 5. Thêm PCF Control vào Solution
```sh
pac solution add-reference --path ../
```
> Đảm bảo đường dẫn trỏ tới thư mục chứa file `.pcfproj` của control.

## 6. Build Solution
```sh
pac solution build --path .
```
- File solution `.zip` sẽ nằm trong `bin/Debug/` hoặc `bin/Release/`.

## 7. Import Solution vào Power Apps
- Vào Power Apps Maker Portal > Solutions > Import solution.
- Chọn file `.zip` vừa build.

## 8. Đổi Environment khi thao tác với Power Platform CLI
- Xem danh sách environment:
  ```sh
  pac auth list
  ```
- Chọn environment:
  ```sh
  pac auth select --index <số thứ tự>
  ```
- Kiểm tra environment hiện tại:
  ```sh
  pac auth who
  ```

## 9. Đẩy nhanh PCF control lên môi trường để test (không cần solution)
- Chạy trong thư mục chứa `.pcfproj`:
  ```sh
  pac pcf push --publisher-prefix <prefix>
  ```
  Ví dụ:
    ```sh
    pac pcf push --publisher-prefix crdfd
    ```

## 10. Xử lý lỗi thường gặp
- **Lỗi file bị khóa (EPERM: operation not permitted, unlink ...):**
  - Đóng mọi ứng dụng đang mở file, xóa file thủ công, hoặc khởi động lại máy.
- **Lỗi add-reference/sai đường dẫn:**
  - Đảm bảo dùng đường dẫn tới thư mục chứa `.pcfproj`.
- **Lỗi import solution: component chưa có trong hệ thống:**
  - Đảm bảo đã add-reference và build solution đúng quy trình.

---

**Tài liệu tham khảo:**
- [Power Platform CLI Docs](https://aka.ms/PowerPlatformCLI)
- [PCF Docs](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/overview) 
