import { json } from "stream/consumers";
import { IInputs, IOutputs } from "./generated/ManifestTypes";

// Interface cho Sale Order
interface ISaleOrder {
  crdfd_sale_orderid: string;
  crdfd_name: string;
  crdfd_tenthuongmai_text: string;
  crdfd_khachhangtext: string;
  crdfd_vatstatus: number;
  createdon: string;
  diachi?: string;
  sdt?: string;
  ghichu?: string;
  dieukhoan?: number;
  tinhthanh?: string;
}

// Interface cho Sale Order Detail
interface ISaleOrderDetail {
  productName: string;
  discount: string;
  quantity: string;
  price: string;
  deliveryDate?: string;
  donvitinh?: string;
  discount2?: string;
  ieuchinhgtgt?: number; // Thêm trường điều chỉnh GTGT
  chieckhauvn?: number; // Thêm trường chiết khấu VND
}

// Interface cho Contact
interface IContact {
  crdfd_name: string;
  crdfd_mail: string;
}

export class PrintForm implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private _container: HTMLDivElement;
  private _context: ComponentFramework.Context<IInputs>;
  private _printButton: HTMLButtonElement;
  private _printContent: HTMLDivElement;
  private _notifyOutputChanged: () => void;
  private _loadingIndicator: HTMLDivElement;
  private _maxRecords: number;
  private _currentSessionId = 0; // Thêm ID phiên làm việc
  private _isDataLoaded = false; // Thêm flag để kiểm tra đã tải đủ dữ liệu chưa

  /**
   * Empty constructor.
   */
  constructor() {
    // Empty constructor
  }

  /**
   * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
   * Data-set values are not initialized here, use updateView.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
   * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
   * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
   * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    console.log("=== Component đang khởi tạo ===");

    this._context = context;
    this._container = container;
    this._notifyOutputChanged = notifyOutputChanged;
    this._maxRecords = parseInt(context.parameters.MaxRecord.raw || "0");

    // Tạo UI
    this.createUI();
  }

  private createUI(): void {
    // Tạo container chính
    const mainContainer = document.createElement("div");
    mainContainer.className = "print-form-container";

    // Tạo loading indicator
    this._loadingIndicator = document.createElement("div");
    this._loadingIndicator.className = "loading-indicator";
    this._loadingIndicator.innerHTML = "Đang tải dữ liệu...";
    this._loadingIndicator.style.display = "none";

    // Tạo container cho nội dung form
    this._printContent = document.createElement("div");
    this._printContent.className = "print-content";

    // Thêm các elements vào container
    mainContainer.appendChild(this._loadingIndicator);
    mainContainer.appendChild(this._printContent);
    this._container.appendChild(mainContainer);
  }

  private renderForm(saleOrder: ISaleOrder, saleOrderDetails: ISaleOrderDetail[]): void {
    // Kiểm tra trạng thái VAT
    const vatStatus = saleOrder.crdfd_vatstatus;
    const isVATApplicable = vatStatus === 283640000;

    // Lấy điều kiện thanh toán
    const paymentCondition = this.getDieuKhoanThanhToan(saleOrder.dieukhoan);

    // 1. Tạo HTML cơ bản
    const htmlContent = this.generateFormHTML(saleOrder, saleOrderDetails);

    // 2. Tạo JavaScript riêng biệt
    const scriptContent = this.generateFormScript(saleOrder, saleOrderDetails);

    // 3. Kết hợp và cập nhật nội dung
    this._printContent.innerHTML = htmlContent;

    // 4. Thêm các phần tử hình ảnh bằng TypeScript
    // Tạo và thêm logo
    const logoContainer = this._printContent.querySelector('#logoContainer');
    if (logoContainer) {
      const logoImg = document.createElement('img');
      logoImg.src = 'https://lh3.googleusercontent.com/d/15hXdOqZ37IYoxISplYRK5MfoDsNBN2_l=s220?authuser=0';
      logoImg.title = 'Weshop';
      logoImg.alt = 'Weshop';
      logoImg.className = 'img-responsive';
      logoImg.style.width = '150px';
      logoImg.style.height = '140px';
      logoImg.style.float = 'right';
      logoImg.style.marginRight = '25px';
      logoContainer.appendChild(logoImg);
    }

    // Tạo và thêm mã QR
    const qrContainer = this._printContent.querySelector('#qrContainer');
    if (qrContainer) {
      const qrImg = document.createElement('img');
      qrImg.src = 'https://lh3.googleusercontent.com/d/16x8h7SfAFlj7q73WKH9zsHBjw2YXfqiK=s220?authuser=0';
      qrImg.style.width = '100px';
      qrImg.style.height = '100px';
      qrImg.style.display = 'block';
      qrImg.style.margin = '0 auto 10px auto'; // Căn giữa và thêm khoảng cách dưới
      
      // Chèn QR code vào đầu container, trước nội dung văn bản
      if (qrContainer.firstChild) {
        qrContainer.insertBefore(qrImg, qrContainer.firstChild);
      } else {
        qrContainer.appendChild(qrImg);
      }
    }

    // 5. Thêm script element riêng biệt
    const scriptElement = document.createElement("script");
    scriptElement.type = "text/javascript";
    scriptElement.textContent = scriptContent;
    this._printContent.appendChild(scriptElement);
  }

  // Phương thức tạo HTML
  private generateFormHTML(saleOrder: ISaleOrder, saleOrderDetails: ISaleOrderDetail[]): string {
    // Lấy ngày hiện tại
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const MM = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayString = `ngày ${dd} tháng ${MM} năm ${yyyy}`;

    return `
<html>
<head>
    <title>${saleOrder.crdfd_name}</title>
    <meta charset='UTF-8'>
    <link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <style>
      /* Các style hiện tại giữ nguyên */
      
      /* Thêm các style mới cho việc in */
      @media screen {
        body {
          margin: 0;
          padding: 0;
          height: 100vh;
          overflow: hidden;
          font-family: Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .print-form-container {
          width: 100%;
          height: 100vh;
          margin: 0 auto;
          overflow-y: auto; /* Thêm thanh cuộn dọc */
          padding: 10px;
          padding-bottom: 50px;
          display: flex;
          flex-direction: column;
          align-items: center; /* Căn giữa nội dung */
        }
        
        .container {
          width: 100%; /* Tăng độ rộng hiển thị */
          max-width: 100%; /* Giới hạn độ rộng tối đa */
          margin: 0 auto;
          padding: 100px; /* Tăng padding cho container */
          background: white;
          margin-bottom: 50px !important;
          box-shadow: 0 0 10px rgba(0,0,0,0.1); /* Thêm shadow cho container */
          font-family: Arial, sans-serif !important;
        }
        
        .table-responsive {
          overflow-x: visible;
        }
        
        #colorTitle {
          background-color: #338da5 !important;
          color: #ffffff !important;
        }
        
        /* Style cho header của bảng */
        .table thead th, 
        .table tbody tr.tt th,
        .table > tbody > tr > th {
          background-color: #338da5 !important;
          color: #ffffff !important;
          text-align: center;
          vertical-align: middle;
        }
        
        /* Style cho nút In và Xuất PDF */
        .action-buttons {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px; /* Tăng margin bottom */
        }
        
        .btn-action {
          padding: 8px 15px;
          margin-left: 10px;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        
        .btn-print {
          background-color: #338da5;
          color: white;
        }
        
        .btn-export-pdf {
          background-color: #d9534f;
          color: white;
        }
        
        .btn-action:hover {
          opacity: 0.85;
          transform: translateY(-2px);
        }
      }
      
      /* Style chung */
      p {
        margin: 0 0 0px !important;
      }

      table {
        margin: 0 0 0px !important;
        width: 100%;
      }

      .table > tbody > tr > td,
      .table > tbody > tr > th,
      .table > tfoot > tr > td,
      .table > tfoot > tr > th,
      .table > thead > tr > td,
      .table > thead > tr > th {
        padding: 6px !important; /* Tăng padding cho cell */
        vertical-align: middle;
      }

      /* Đảm bảo phần cuối cùng hiển thị đầy đủ */
      .row:last-child {
        margin-bottom: 50px;
      }
      
      /* Thêm màu cho header của table */
      .table > tbody > tr.tt > th {
        background-color: #338da5 !important;
        color: #ffffff !important;
      }
      
      /* Đảm bảo màu nền được in */
      #colorTitle, 
      th[id="colorTitle"],
      .table tbody tr th#colorTitle {
        background-color: #338da5 !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Fix cho font-size */
      #name_shop {
        font-size: 30px !important;
      }
      
      /* Đảm bảo tất cả kích thước font được render đúng */
      body, table, td, th, p, span, div {
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
      }
      
      /* Ghi đè Bootstrap CSS */
      .table:not(.table-product-details) {
        border: none !important;
      }
      .table:not(.table-product-details) > thead > tr > th,
      .table:not(.table-product-details) > tbody > tr > th,
      .table:not(.table-product-details) > tfoot > tr > th,
      .table:not(.table-product-details) > thead > tr > td,
      .table:not(.table-product-details) > tbody > tr > td,
      .table:not(.table-product-details) > tfoot > tr > td {
        border: none !important;
      }
      .table-bordered:not(.table-product-details) {
        border: none !important;
      }
      .table-bordered:not(.table-product-details) > thead > tr > th,
      .table-bordered:not(.table-product-details) > tbody > tr > th,
      .table-bordered:not(.table-product-details) > tfoot > tr > th,
      .table-bordered:not(.table-product-details) > thead > tr > td,
      .table-bordered:not(.table-product-details) > tbody > tr > td,
      .table-bordered:not(.table-product-details) > tfoot > tr > td {
        border: none !important;
      }
      
      /* CSS cho bảng thông tin thanh toán */
      .table[style*="table-layout: fixed"] {
        table-layout: fixed !important;
        width: 100% !important;
      }
      
      .table[style*="table-layout: fixed"] tr[style*="display: flex"] {
        display: flex !important;
        width: 100% !important;
      }
      
      .table[style*="table-layout: fixed"] td[style*="flex: 1"] {
        flex: 1 !important;
        width: 33.33% !important;
        display: inline-block !important;
        vertical-align: top !important;
      }
    </style>
</head>

<body>
    <div class='container' style='font-family: Arial, sans-serif !important; width: 100%; max-width: 100%; margin: 0 auto; background: white; margin-bottom: 50px; padding: 20px;'>
      <div class="action-buttons no-print">
        <button id="btnPrint" class="btn-action btn-print">In</button>
        <button id="btnClick" class="btn-action btn-export-pdf">Lưu</button>
      </div>
      <div class='row'>
        <div class='table-responsive'>
          <table class='table'>
            <tbody>
              <tr class='tt'>
                <td width='20%' style='vertical-align: middle' id="logoContainer">
                  <!-- Logo sẽ được thêm bằng TypeScript -->
                </td>
                <td id='name_shop' width='20%' style='
                    text-align: left;
                    vertical-align: middle;
                    font-size: 30px;
                    font-weight: bold;
                    text-align: left;
                  '>${saleOrder.crdfd_tenthuongmai_text || 'WECARE'}</td>
                <td style='text-align: right; font-size: 20px'>
                  <p id='name_shop_title'>${saleOrder.crdfd_tenthuongmai_text === 'WECARE' ? 'CÔNG TY CỔ PHẦN WECARE GROUP' : 'HỘ KINH DOANH WESHOP'}</p>
                  <p>Địa chỉ: Lô B39 Khu công nghiệp Phú Tài, phường</p>
                  <p>Trần Quang Diệu, Quy Nhơn, Bình Định</p>
                  <p>Số điện thoại: 037 833 9009</p>
                  <p>MST: 4101562154</p>
                  <p>Website: https://wecare.com.vn</p>
                  <p>Quy Nhơn, <span id='NgayThangNam'>${todayString}</span></p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <br>
      <div class='row'>
        <div class='table-responsive'>
          <table class='table table-bordered'>
            <tbody>
              <tr>
                <th colspan='8' style='
                    text-align: center;
                    padding: 10px !important;
                    background-color: #338da5 !important;
                    color: #ffffff !important;
                    font-size: 20px;
                  ' id='SCT'>${saleOrder.crdfd_name}</th>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class='row'>
        <div class='table-responsive'>
          <table class='table'>
            <tbody style='font-size: 21px; padding: 1px; text-align: center'>
              <tr>
                <td class='col-xs-9' style='text-align: left'>
                  Tên khách hàng:
                  <span id='tenKhachHang' style='font-size: 21px; font-weight: bold !important'>${saleOrder.crdfd_khachhangtext}</span>
                </td>
                <td style='text-align: left'>
                  SĐT: <span id='SDTKhachHang' style='font-size: 21px'>${saleOrder.sdt || ''}</span>
                </td>
              </tr>
              <tr>
                <td colspan='2' style='text-align: left'>
                  Địa chỉ:
                  <span id='diaChiKhachHang' style='font-size: 21px'>${saleOrder.diachi || ''}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <br>

      <div class='row'>
        <div class='table-responsive'>
          <table class='table table-bordered table-product-details'>
            <tbody style='font-size: 20px; padding: 1px; text-align: center'>
              <tr class='tt'>
                <th style='text-align: center; vertical-align: middle; width: 3% !important;' id='colorTitle'>STT</th>
                <th style='text-align: center; vertical-align: middle; width: 20% !important;' id='colorTitle'>Tên sản phẩm</th>
                <th style='text-align: center; vertical-align: middle; width: 5% !important;' id='colorTitle'>VAT</th>
                <th style='text-align: center; vertical-align: middle; width: 7% !important;' id='colorTitle'>CK1</th>
                <th style='text-align: center; vertical-align: middle; width: 7% !important;' id='colorTitle'>CK2</th>
                <th style='text-align: center; vertical-align: middle; width: 7% !important;' id='colorTitle'>ĐVT</th>
                <th style='text-align: center; vertical-align: middle; width: 7% !important;' id='colorTitle'>Số lượng</th>
                <th style='text-align: center; vertical-align: middle; width: 10% !important;' id='colorTitle'>Đơn giá</th>
                <th style='text-align: center; vertical-align: middle; width: 12% !important;' id='colorTitle'>Đơn giá sau CK</th>
                <th style='text-align: center; vertical-align: middle; width: 12% !important;' id='colorTitle'>Thành tiền</th>
                <th style='text-align: center; vertical-align: middle; width: 15% !important;' id='colorTitle'>Ngày giao dự kiến</th>
              </tr>
            </tbody>
            <tbody id='entityType' style='word-wrap: break-word; font-size: 20px; padding: 1px'>
                ${this.renderOrderDetailsRows(saleOrderDetails)}
            </tbody>
            <tbody style='word-wrap: break-word; font-size: 20px; padding: 1px'>
              <tr style='padding: 1px'>
                <td colspan='8' style='text-align: right; padding-right: 5px'>
                  TỔNG GIÁ TRỊ ĐƠN HÀNG
                </td>
                <td colspan='2' id='GiaTriDonHang' style='text-align: right; padding-right: 5px !important'>${this.calculateTotalOrderValue(saleOrderDetails)}</td>
                <td></td>
              </tr>
              <tr style='padding: 1px'>
                <td colspan='8' style='text-align: right; padding-right: 5px'>
                  CHIẾT KHẤU ORDER
                </td>
                <td colspan='2' id='GiamGiaso' style='text-align: right; padding-right: 5px !important'>0 đ</td>
                <td></td>
              </tr>
              <tr>
                <td colspan='8' style='text-align: right; padding-right: 5px'>
                  VAT
                </td>
                <td colspan='2' id='GTGT' style='text-align: right; padding-right: 5px !important'>${this.calculateVAT(saleOrder, saleOrderDetails)}</td>
                <td></td>
              </tr>
              <tr>
                <td colspan='8' style='text-align: right; padding-right: 5px'>
                  TỔNG TIỀN
                </td>
                <td colspan='2' id='TongTien' style='text-align: right; padding-right: 5px !important'>${this.calculateFinalTotal(saleOrder, saleOrderDetails)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <br>
          <p style='font-size: 20px'>* Ghi chú: <span id='ghichu'>${saleOrder.ghichu || ''}</span></p>
        </div>
            </div>

      <br>
      <div class='row'>
        <div class='table-responsive'>
          <table class='table' style='font-size: 20px; border: none; table-layout: fixed;'>
            <tbody>
              <tr style="display: flex; width: 100%;">
                <td style='flex: 1; text-align: left; background-color: transparent !important; color: #333 !important; vertical-align: top; border: none !important;'>
                  <h4 style="font-size: 20px; margin-bottom: 10px;">Điều khoản thanh toán</h4>
                  <p id='HTTT' style='font-weight: normal !important; margin-bottom: 10px;'>${this.getDieuKhoanThanhToan(saleOrder.dieukhoan)}</p>
                  <div id='chuyenkhoan' style="margin-top: 10px;">${this.getThongTinChuyenKhoan(saleOrder.tinhthanh)}</div>
                </td>

                <td style='flex: 1; text-align: center; background-color: transparent !important; color: #333 !important; vertical-align: top; border: none !important;'>
                  <h4 style="font-size: 20px; margin-bottom: 10px;">Ngày đặt hàng</h4>
                  <p id='NDH' style='font-weight: normal !important'>${this.formatTimestamp(Number(saleOrder.createdon))}</p>
                </td>
                <td style='flex: 1; text-align: center; background-color: transparent !important; color: #333 !important; vertical-align: top; border: none !important;'>
                  <h4 style="font-size: 20px; margin-bottom: 10px;">Thời gian giao hàng dự kiến</h4>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <br>
      <div class='row' id='title_wc'>
      ${saleOrder.crdfd_tenthuongmai_text === 'WECARE' ?
        `<p style='font-size: 20px; padding:10px'>
          <b class='tt-ft'>Về Wecare:</b><br>
          Chúng tôi mong muốn hỗ trợ các công ty, nhà máy, đơn vị xây dựng,
          thiết kế có được những sự lựa chọn đáng tin cậy cho các giải pháp về phụ kiện phụ trợ,
          để các doanh nghiệp có thể yên tâm &amp; toàn tâm trong sản phẩm chính của mình.
      </p>` : ''}
      </div>
        <br>
      <div class='row'>
        <div class='table-responsive'>
          <table class='table' style='font-size: 20px; border: none; table-layout: fixed;'>
            <tbody>
              <tr style="display: flex; width: 100%;">
                <td style='flex: 1; text-align: center; background-color: transparent !important; color: #333 !important; vertical-align: top; border: none !important;' id="qrContainer">
                    <p style="margin-top: 10px;">https://wecare.com.vn</p>
                </td>
                <td style='flex: 1; text-align: center; background-color: transparent !important; color: #333 !important; vertical-align: top; border: none !important;'>
                  <h4 style="font-size: 20px; margin-bottom: 10px;">Bên mua</h4>
                  <p style="height: 80px;"></p>
                </td>
                <td style='flex: 1; text-align: center; background-color: transparent !important; color: #333 !important; vertical-align: top; border: none !important;'>
                  <h4 style="font-size: 20px; margin-bottom: 10px;">Bên bán</h4>
                  <p style="height: 80px;"></p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <br>
    </div>
</body>
</html>
    `;
  }

  // Phương thức định dạng thời gian để sử dụng cho tên file
  private formatDateTime(date: Date = new Date(), removeSlash = false): string {
    // Lấy giờ và phút
    const time = date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
    
    // Lấy ngày, tháng, năm
    const dateStr = date.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'});
    
    // Nếu cần loại bỏ dấu gạch chéo
    const formattedDate = removeSlash ? dateStr.replace(/\//g, '') : dateStr;
    
    // Trả về định dạng hh:mm dd/MM/yyyy hoặc hh:mm ddMMyyyy
    return `${time}_${formattedDate}`;
  }

  // Phương thức tạo JavaScript
  private generateFormScript(saleOrder: ISaleOrder, saleOrderDetails: ISaleOrderDetail[]): string {
    // Lấy định dạng thời gian hiện tại cho tên file
    const formattedDateTime = this.formatDateTime(new Date(), true);
    
    return `
function myFunction() {
    // Hiển thị popup xác nhận trước khi xuất PDF
    showConfirmDialog();
}

// Hàm hiển thị popup xác nhận
function showConfirmDialog() {
    // Tạo overlay (nền đen mờ)
    var overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '9998';
    document.body.appendChild(overlay);
    
    // Tạo dialog
    var dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.width = '350px';
    dialog.style.padding = '20px';
    dialog.style.backgroundColor = 'white';
    dialog.style.borderRadius = '20px';
    dialog.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    dialog.style.zIndex = '9999';
    
    // Tạo nội dung dialog
    dialog.innerHTML = \`
        <div style="text-align: center; margin-bottom: 20px; font-family: Arial, sans-serif;">
            <h3 style="margin-bottom: 15px; color: #333; font-family: Arial, sans-serif;">Xác nhận</h3>
            <p style="font-size: 16px; color: #666; font-family: Arial, sans-serif;">Bạn muốn gửi qua OA khách hàng không?</p>
            <div style="display: flex; justify-content: center; gap: 70px; margin-top: 20px;">
                <button id="btnSaveOnly" style="padding: 8px 15px; border: 1px solid #338da5; background-color: white; color: #338da5; border-radius: 4px; cursor: pointer; font-family: Arial, sans-serif;">Lưu</button>
                <button id="btnSaveAndSend" style="padding: 8px 15px; border: none; background-color: #338da5; color: white; border-radius: 4px; cursor: pointer; font-family: Arial, sans-serif;">Gửi</button>
            </div>
        </div>
    \`;
    
    document.body.appendChild(dialog);
    
    // Xử lý sự kiện cho nút "Lưu"
    document.getElementById('btnSaveOnly').addEventListener('click', function() {
        document.body.removeChild(overlay);
        document.body.removeChild(dialog);
        exportToPdf(false);
    });
    
    // Xử lý sự kiện cho nút "Gửi"
    document.getElementById('btnSaveAndSend').addEventListener('click', function() {
        document.body.removeChild(overlay);
        document.body.removeChild(dialog);
        exportToPdf(true);
    });
    
    // Đóng dialog khi click ra ngoài
    overlay.addEventListener('click', function() {
        document.body.removeChild(overlay);
        document.body.removeChild(dialog);
    });
}

function exportToPdf(shouldConfirm) {
    // Lấy nội dung hiện tại của form
    var element = document.querySelector('.container');
    if (!element) {
        console.error('Không tìm thấy form container');
        return;
    }

    // Hiển thị thông báo đang tạo PDF
    var processingMessage = document.createElement('div');
    processingMessage.style.position = 'fixed';
    processingMessage.style.top = '50%';
    processingMessage.style.left = '50%';
    processingMessage.style.transform = 'translate(-50%, -50%)';
    processingMessage.style.padding = '20px';
    processingMessage.style.background = 'rgba(0,0,0,0.7)';
    processingMessage.style.color = 'white';
    processingMessage.style.borderRadius = '5px';
    processingMessage.style.zIndex = '9999';
    processingMessage.style.width = '250px';
    processingMessage.style.textAlign = 'center';
    processingMessage.innerHTML = '<div>Đang tạo PDF...</div><div style="margin-top:10px;font-size:12px;">Vui lòng đợi trong giây lát</div>';
    document.body.appendChild(processingMessage);
    
    // Hàm cập nhật thông báo
    function updateMessage(text) {
        processingMessage.innerHTML = '<div>' + text + '</div><div style="margin-top:10px;font-size:12px;">Vui lòng đợi trong giây lát</div>';
    }

    // Ghi log để debug
    console.log("Bắt đầu tạo PDF");

    // Tạo một iframe mới để xử lý nội dung in/xuất PDF riêng biệt
    var printFrame = document.createElement('iframe');
    printFrame.style.visibility = 'hidden';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    document.body.appendChild(printFrame);

    // Ghi nội dung vào iframe
    var frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write('<!DOCTYPE html><html><head>');
    
    // Copy các style từ trang gốc
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(styleSheet => {
        frameDoc.write(styleSheet.outerHTML);
    });
    
    // Thêm style đặc biệt cho iframe, sử dụng các style tương tự như hàm print
    frameDoc.write(\`
        <style>
            body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .container {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 50px !important; /* Thêm padding 50px khi in */
            }
            .no-print {
                display: none !important;
            }
            
            /* Đảm bảo hình ảnh được tải đầy đủ */
            img {
                max-width: 100%;
                height: auto;
                display: block;
            }
            
            /* Loại bỏ border mặc định cho tất cả các bảng */
            table {
                border: none !important;
                border-collapse: collapse !important;
                page-break-inside: auto;
                width: 100% !important;
            }
            
            /* Loại bỏ border cho các cell của table */
            table td, table th {
                border: none !important;
            }
            
            /* Chỉ thêm border cho bảng chi tiết đơn hàng */
            .table-bordered, 
            table.table-bordered,
            table.table-bordered th, 
            table.table-bordered td {
                border: 1px solid #ddd !important;
            }
            
            /* Ngoại lệ: Xóa border cho table có cha là bảng chi tiết đơn hàng nhưng không phải là dữ liệu sản phẩm */
            .table-bordered:not(.table-product-details),
            .table-bordered:not(.table-product-details) th,
            .table-bordered:not(.table-product-details) td {
                border: none !important;
            }
            
            /* Đảm bảo bảng chi tiết đơn hàng có border đầy đủ */
            #entityType tr td,
            #entityType tr th,
            table tbody tr td[id='GiaTriDonHang'],
            table tbody tr td[id='GiamGiaso'],
            table tbody tr td[id='GTGT'],
            table tbody tr td[id='TongTien'] {
                border: 1px solid #ddd !important;
            }
            
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            
            thead {
                display: table-header-group;
            }
            
            tfoot {
                display: table-footer-group;
            }
            
            /* Đảm bảo text không bị cắt khi in */
            td, th {
                overflow: visible !important;
                white-space: normal !important;
                word-wrap: break-word !important;
            }
            
            /* Fix màu nền */
            #colorTitle, 
            th[id="colorTitle"],
            .table tbody tr th#colorTitle {
                background-color: #338da5 !important;
                color: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            /* Ghi đè Bootstrap CSS */
            .table:not(.table-product-details) {
                border: none !important;
            }
            .table:not(.table-product-details) > thead > tr > th,
            .table:not(.table-product-details) > tbody > tr > th,
            .table:not(.table-product-details) > tfoot > tr > th,
            .table:not(.table-product-details) > thead > tr > td,
            .table:not(.table-product-details) > tbody > tr > td,
            .table:not(.table-product-details) > tfoot > tr > td {
                border: none !important;
            }
            .table-bordered:not(.table-product-details) {
                border: none !important;
            }
            .table-bordered:not(.table-product-details) > thead > tr > th,
            .table-bordered:not(.table-product-details) > tbody > tr > th,
            .table-bordered:not(.table-product-details) > tfoot > tr > th,
            .table-bordered:not(.table-product-details) > thead > tr > td,
            .table-bordered:not(.table-product-details) > tbody > tr > td,
            .table-bordered:not(.table-product-details) > tfoot > tr > td {
                border: none !important;
            }
            
            /* CSS cho bảng thông tin thanh toán */
            .table[style*="table-layout: fixed"] {
                table-layout: fixed !important;
                width: 100% !important;
            }
            
            .table[style*="table-layout: fixed"] tr[style*="display: flex"] {
                display: flex !important;
                width: 100% !important;
            }
            
            .table[style*="table-layout: fixed"] td[style*="flex: 1"] {
                flex: 1 !important;
                width: 33.33% !important;
                display: inline-block !important;
                vertical-align: top !important;
            }
        </style>
    \`);
    
    frameDoc.write('</head><body>');
    frameDoc.write(element.outerHTML);
    frameDoc.write('</body></html>');
    frameDoc.close();
    
    console.log("Iframe đã được tạo");
    
    // Đợi iframe load xong
    printFrame.onload = function() {
        console.log("Iframe đã load xong");
        updateMessage("Đang xử lý hình ảnh...");
        
        // Thay đổi URL của hình ảnh trong iframe để sử dụng Google Drive
        Array.from(frameDoc.querySelectorAll('img')).forEach(img => {
            // Thay đổi URL nếu là URL SharePoint hoặc WebResources
            if (img.src && (img.src.includes('wecarei-my.sharepoint.com') || img.src.includes('wecare-ii.crm5.dynamics.com'))) {
                if (img.src.includes('crdfd_logo')) {
                    img.src = 'https://lh3.googleusercontent.com/d/15hXdOqZ37IYoxISplYRK5MfoDsNBN2_l=s220?authuser=0';
                    console.log("Đã thay đổi URL logo:", img.src);
                } else if (img.src.includes('new_qrcodenew')) {
                    img.src = 'https://lh3.googleusercontent.com/d/16x8h7SfAFlj7q73WKH9zsHBjw2YXfqiK=s220?authuser=0';
                    console.log("Đã thay đổi URL QR code:", img.src);
                }
            }
        });
        
        // Đảm bảo tất cả hình ảnh đã được tải
        var images = Array.from(frameDoc.querySelectorAll('img'));
        console.log("Số lượng hình ảnh cần tải: " + images.length);
        
        var imagesLoaded = Promise.all(
            images.map((img, index) => {
                if(img.complete) {
                    console.log("Hình ảnh " + index + " đã tải xong");
                    return Promise.resolve();
                } else {
                    console.log("Đang tải hình ảnh " + index);
                    return new Promise(resolve => {
                        img.onload = () => {
                            console.log("Hình ảnh " + index + " tải thành công");
                            resolve();
                        };
                        img.onerror = () => {
                            console.log("Lỗi khi tải hình ảnh " + index);
                            resolve(); // Xử lý cả trường hợp lỗi
                        };
                    });
                }
            })
        );
        
        // Sau khi tất cả hình ảnh đã tải xong
        imagesLoaded.then(() => {
            console.log("Tất cả hình ảnh đã tải xong");
            updateMessage("Đang tạo file PDF...");
            
            // Áp dụng CSS cho bảng trước khi tạo PDF
            try {
                // Loại bỏ border cho tất cả bảng không phải bảng chi tiết
                Array.from(frameDoc.querySelectorAll('table:not(.table-product-details)')).forEach(table => {
                    table.style.border = 'none';
                    Array.from(table.querySelectorAll('td, th')).forEach(cell => {
                        cell.style.border = 'none';
                    });
                });
                
                // Đảm bảo border cho bảng chi tiết đơn hàng
                const productTable = frameDoc.querySelector('.table-product-details');
                if (productTable) {
                    productTable.style.borderCollapse = 'collapse';
                    productTable.style.border = '1px solid #ddd';
                    Array.from(productTable.querySelectorAll('td, th')).forEach(cell => {
                        cell.style.border = '1px solid #ddd';
                    });
                }
                
                // Điều chỉnh border cho các phần tổng tiền
                Array.from(frameDoc.querySelectorAll('#GiaTriDonHang, #GiamGiaso, #GTGT, #TongTien')).forEach(cell => {
                    if (cell) {
                        cell.style.border = '1px solid #ddd';
                    }
                });
                
                console.log("Đã điều chỉnh border cho các bảng");
            } catch (error) {
                console.error("Lỗi khi điều chỉnh border:", error);
            }
            
            // Thêm thư viện html2pdf vào iframe
            var script = frameDoc.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            
            script.onload = function() {
                console.log("Thư viện html2pdf đã tải xong");
                
                // Khi thư viện đã tải xong, xuất PDF
                try {
                    var content = frameDoc.querySelector('.container');
                    var opt = {
                        //margin: [10, 10, 10, 10], // top, right, bottom, left
                        filename: '${saleOrder.crdfd_name || "DonHang"}_${formattedDateTime}.pdf',
                        image: { type: 'jpeg', quality: 1.0 },
                        html2canvas: { 
                            scale: 2, 
                            useCORS: true,
                            logging: true,
                            letterRendering: true,
                            allowTaint: true
                        },
                        jsPDF: { 
                            unit: 'mm', 
                            format: 'a4', 
                            orientation: 'landscape' // Chuyển sang định dạng nằm ngang
                        }
                    };
                    
                    console.log("Bắt đầu tạo PDF với các tùy chọn:", opt);
                    updateMessage("Đang xử lý nội dung...");
                    
                    // Sử dụng setTimeout để đảm bảo tất cả nội dung đã render
                    setTimeout(function() {
                        console.log("Bắt đầu chuyển đổi HTML sang PDF");
                        updateMessage("Đang chuyển đổi HTML sang PDF...");
                        
                        // Tạo PDF và gửi lên API
                        frameDoc.defaultView.html2pdf().from(content).set(opt).outputPdf('datauristring')
                        .then(function(pdfBase64) {
                            console.log("Đã tạo PDF base64 thành công");
                            updateMessage("Đang gửi PDF lên máy chủ...");
                            
                            // Gửi PDF lên API với thông tin về xác nhận
                            sendPdfToApi(pdfBase64, '${saleOrder.crdfd_sale_orderid || "ID123"}', '${saleOrder.crdfd_name || "DonHang"}_${formattedDateTime}.pdf', shouldConfirm)
                            .then((responseText) => {
                                console.log("Đã gửi PDF lên API thành công, phản hồi:", responseText);
                                updateMessage("Đang tải xuống PDF...");
                                
                                // Sau đó tải xuống PDF
                                return frameDoc.defaultView.html2pdf().from(content).set(opt).save();
                            })
                            .then(function() {
                                console.log("Đã tải xuống PDF thành công");
                                updateMessage("Hoàn tất!");
                                
                                // Đóng thông báo sau khi hoàn tất
                                setTimeout(function() {
                                    document.body.removeChild(processingMessage);
                                    document.body.removeChild(printFrame);
                                }, 1500);
                            })
                            .catch(function(error) {
                                console.error("Lỗi khi xử lý PDF:", error);
                                updateMessage("Có lỗi xảy ra! Vui lòng thử lại.");
                                setTimeout(function() {
                                    document.body.removeChild(processingMessage);
                                    document.body.removeChild(printFrame);
                                }, 3000);
                            });
                        })
                        .catch(function(error) {
                            console.error("Lỗi khi tạo PDF:", error);
                            updateMessage("Có lỗi xảy ra khi tạo PDF!");
                            setTimeout(function() {
                                document.body.removeChild(processingMessage);
                                document.body.removeChild(printFrame);
                            }, 3000);
                        });
                    }, 1000); // Tăng thời gian đợi lên 1000ms để đảm bảo mọi thứ đã render
                } catch (e) {
                    console.error('Lỗi khi xuất PDF:', e);
                    updateMessage("Có lỗi xảy ra! Vui lòng thử lại.");
                    setTimeout(function() {
                        document.body.removeChild(processingMessage);
                        document.body.removeChild(printFrame);
                    }, 3000);
                }
            };
            
            script.onerror = function() {
                console.error("Lỗi khi tải thư viện html2pdf");
                updateMessage("Lỗi khi tải thư viện! Vui lòng thử lại.");
                setTimeout(function() {
                    document.body.removeChild(processingMessage);
                    document.body.removeChild(printFrame);
                }, 3000);
            };
            
            frameDoc.body.appendChild(script);
        }).catch(error => {
            console.error('Lỗi khi tải hình ảnh:', error);
            updateMessage("Lỗi khi tải hình ảnh! Vui lòng thử lại.");
            setTimeout(function() {
                document.body.removeChild(processingMessage);
                document.body.removeChild(printFrame);
            }, 3000);
        });
    };
}

function sendPdfToApi(pdfDataUri, saleOrderId, SOName, shouldConfirm) {
    // Loại bỏ phần đầu 'data:application/pdf;base64,' để lấy chuỗi base64 thuần túy
    var base64Data = pdfDataUri.split(',')[1] || pdfDataUri;
    
    // Tạo dữ liệu để gửi đi
    var postData = {
        "File_Name": SOName,
        "ID_SO": saleOrderId,
        "File": base64Data,
        "Confirm": shouldConfirm === true // Đảm bảo là boolean
    };
    
    // URL API
    var apiUrl = "https://prod-62.southeastasia.logic.azure.com:443/workflows/b0681ade249043eeb8f69b786b78cd64/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=t6bBO3XN_UKAKWmRjt-A9GjYoU-U_pyfDxcSTVXFhw0";
    
    // Gửi request bằng fetch API và trả về promise để xử lý chuỗi
    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    })
    .then(response => {
        if (response.ok) {
            console.log('PDF đã được gửi thành công đến API');
            return response.text(); // Đọc response dưới dạng text thay vì JSON
        }
        throw new Error('Gửi PDF thất bại');
    })
    .then(data => {
        console.log('Kết quả từ API:', data);
        return data;
    })
    .catch(error => {
        console.error('Lỗi khi gửi API:', error);
        throw error;
    });
}

function handlePrint() {
    // Lấy nội dung hiện tại của form
    var element = document.querySelector('.container');
    if (!element) {
        console.error('Không tìm thấy form container');
        return;
    }

    // Tạo một iframe mới
    var printFrame = document.createElement('iframe');
    printFrame.style.visibility = 'hidden';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    document.body.appendChild(printFrame);

    // Ghi nội dung vào iframe
    var frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write('<!DOCTYPE html><html><head>');
    
    // Copy các style từ trang gốc
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(styleSheet => {
        frameDoc.write(styleSheet.outerHTML);
    });
    
    // Thêm style đặc biệt cho iframe
    frameDoc.write(\`
        <style>
            body {
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 50px !important; /* Thêm padding 50px khi in */
            }
            .no-print {
                display: none !important;
            }
        </style>
    \`);
    
    frameDoc.write('</head><body>');
    frameDoc.write(element.outerHTML);
    frameDoc.write('</body></html>');
    frameDoc.close();
    
    // Đợi tải xong các resource
    printFrame.onload = function() {
        try {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
        } catch (e) {
            console.error('Lỗi khi in:', e);
        }
        
        // Xóa iframe sau khi in xong
        setTimeout(function() {
            document.body.removeChild(printFrame);
        }, 500);
    };
}

// Thêm thư viện html2pdf vào trang và gắn sự kiện cho các nút
function initializeButtons() {
    // Gắn sự kiện cho nút xuất PDF
    var exportButton = document.getElementById('btnClick');
    if (exportButton) {
        exportButton.addEventListener('click', myFunction);
    }
    
    // Gắn sự kiện cho nút in
    var printButton = document.getElementById('btnPrint');
    if (printButton) {
        printButton.addEventListener('click', handlePrint);
    }
}

// Thêm thư viện html2pdf vào trang
function addHtml2PdfLib() {
    if (!document.getElementById('html2pdf-script')) {
        var script = document.createElement('script');
        script.id = 'html2pdf-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = initializeButtons;
        document.head.appendChild(script);
    } else {
        initializeButtons();
    }
}

// Gọi hàm thêm thư viện
addHtml2PdfLib();
  `;
  }

  // Phương thức tạo HTML cho chi tiết đơn hàng
  private renderOrderDetailsRows(details: ISaleOrderDetail[]): string {
    let html = '';

    details.forEach((detail, index) => {
      const quantity = parseFloat(detail.quantity) || 0;
      const originalPrice = parseFloat(detail.price) || 0;
      const discount1Percentage = parseFloat(detail.discount) || 0;
      const discount2Percentage = parseFloat(detail.discount2 || '0') || 0;
      const chieckhauvn = detail.chieckhauvn || 0;
      
      // Tính tiền chiết khấu 1
      const discountAmount1 = originalPrice * discount1Percentage;
      
      // Giá sau chiết khấu 1
      const priceAfterDiscount1 = originalPrice - discountAmount1;
      
      // Tính tiền chiết khấu 2
      const discountAmount2 = priceAfterDiscount1 * discount2Percentage;
      
      // Giá sau chiết khấu 2
      const priceAfterDiscount2 = priceAfterDiscount1 - discountAmount2;
      
      // Thành tiền
      const totalPrice = quantity * priceAfterDiscount2;

      // Ngày giao dự kiến
      const deliveryDate = detail.deliveryDate ? this.formatTimestamp(Number(detail.deliveryDate)) : '';
      
      // Xác định VAT dựa vào giá trị crdfd_ieuchinhgtgt
      let vatPercentage = "0";
      const ieuchinhgtgt = detail.ieuchinhgtgt;
      
      if (ieuchinhgtgt !== undefined) {
        switch (ieuchinhgtgt) {
          case 191920000: // 0%
            vatPercentage = "0";
            break;
          case 191920001: // 5%
            vatPercentage = "5";
            break;
          case 191920002: // 8%
            vatPercentage = "8";
            break;
          case 191920003: // 10%
            vatPercentage = "10";
            break;
          default:
            vatPercentage = "0";
        }
      }

      // Hiển thị chi tiết đơn hàng
      html += `
            <tr>
                <td style='text-align: center;'>${index + 1}</td>
                <td style='text-align: left;'>${detail.productName}</td>
                <td style='text-align: center;'>${vatPercentage}%</td>`;
                
      // Hiển thị chiết khấu 1 (theo % hoặc VND)
      if (discount1Percentage > 0) {
        html += `<td style='text-align: center;'>${(discount1Percentage * 100).toFixed(1)}%</td>`;
      } else if (chieckhauvn > 0) {
        html += `<td style='text-align: center;'>${this.formatCurrency(chieckhauvn)} đ</td>`;
      } else {
        html += `<td style='text-align: center;'>0%</td>`;
      }
      
      // Hiển thị chiết khấu 2
      html += `<td style='text-align: center;'>${(discount2Percentage * 100).toFixed(1)}%</td>
                <td style='text-align: center;'>${detail.donvitinh || 'Cái'}</td>
                <td style='text-align: right; padding-right: 5px !important;'>${this.formatNumber(quantity)}</td>
                <td style='text-align: right; padding-right: 5px !important;'>${this.formatCurrency(originalPrice)} đ</td>
                <td style='text-align: right; padding-right: 5px !important;'>${this.formatCurrency(priceAfterDiscount2)} đ</td>
                <td style='text-align: right; padding-right: 5px !important;'>${this.formatCurrency(totalPrice)} đ</td>
                <td style='text-align: right; padding-right: 5px !important;'>${deliveryDate}</td>
            </tr>
            `;
    });

    return html;
  }

  // Tính tổng giá trị đơn hàng
  private calculateTotalOrderValue(details: ISaleOrderDetail[]): string {
    let tongTienDonHang = 0;

    details.forEach(detail => {
      const quantity = parseFloat(detail.quantity) || 0;
      const originalPrice = parseFloat(detail.price) || 0;
      const discount1Percentage = parseFloat(detail.discount) || 0;
      const discount2Percentage = parseFloat(detail.discount2 || '0') || 0;
      
      // Tính tiền chiết khấu 1
      const discountAmount1 = originalPrice * discount1Percentage;
      
      // Giá sau chiết khấu 1
      const priceAfterDiscount1 = originalPrice - discountAmount1;
      
      // Tính tiền chiết khấu 2
      const discountAmount2 = priceAfterDiscount1 * discount2Percentage;
      
      // Giá sau chiết khấu 2
      const priceAfterDiscount2 = priceAfterDiscount1 - discountAmount2;
      
      // Cộng vào tổng tiền
      tongTienDonHang += quantity * priceAfterDiscount2;
    });

    return `${this.formatCurrency(tongTienDonHang)} đ`;
  }

  // Tính VAT
  private calculateVAT(saleOrder: ISaleOrder, details: ISaleOrderDetail[]): string {
    let sumGTGT = 0;

    if (saleOrder.crdfd_vatstatus === 191920000) { // Có VAT
      details.forEach(detail => {
        const quantity = parseFloat(detail.quantity) || 0;
        const originalPrice = parseFloat(detail.price) || 0;
        const discount1Percentage = parseFloat(detail.discount) || 0;
        const discount2Percentage = parseFloat(detail.discount2 || '0') || 0;
        const ieuchinhgtgt = detail.ieuchinhgtgt;
        
        // Tính tiền chiết khấu 1
        const discountAmount1 = originalPrice * discount1Percentage;
        
        // Giá sau chiết khấu 1
        const priceAfterDiscount1 = originalPrice - discountAmount1;
        
        // Tính tiền chiết khấu 2
        const discountAmount2 = priceAfterDiscount1 * discount2Percentage;
        
        // Giá sau chiết khấu 2
        const priceAfterDiscount2 = priceAfterDiscount1 - discountAmount2;
        
        // Tính tổng tiền và VAT
        const totalPrice = quantity * priceAfterDiscount2;
        
        // Tính VAT dựa trên crdfd_ieuchinhgtgt
        let vatRate = 0;
        if (ieuchinhgtgt !== undefined) {
          switch (ieuchinhgtgt) {
            case 191920000: // 0%
              vatRate = 0;
              break;
            case 191920001: // 5%
              vatRate = 0.05;
              break;
            case 191920002: // 8%
              vatRate = 0.08;
              break;
            case 191920003: // 10%
              vatRate = 0.1;
              break;
            default:
              vatRate = 0;
          }
        } else {
          // Mặc định là 10% nếu không có thông tin
          vatRate = 0.1;
        }
        
        sumGTGT += totalPrice * vatRate;
      });
    }

    return `${this.formatCurrency(sumGTGT)} đ`;
  }

  // Tính tổng tiền cuối cùng
  private calculateFinalTotal(saleOrder: ISaleOrder, details: ISaleOrderDetail[]): string {
    let tongTienDonHang = 0;
    let sumGTGT = 0;
    const tienChietKhauSO = 0; // Tiền chiết khấu của đơn hàng
    
    // TODO: Trong tương lai, cần lấy tiền chiết khấu đơn hàng từ API nếu có

    details.forEach(detail => {
      const quantity = parseFloat(detail.quantity) || 0;
      const originalPrice = parseFloat(detail.price) || 0;
      const discount1Percentage = parseFloat(detail.discount) || 0;
      const discount2Percentage = parseFloat(detail.discount2 || '0') || 0;
      const ieuchinhgtgt = detail.ieuchinhgtgt;
      
      // Tính tiền chiết khấu 1
      const discountAmount1 = originalPrice * discount1Percentage;
      
      // Giá sau chiết khấu 1
      const priceAfterDiscount1 = originalPrice - discountAmount1;
      
      // Tính tiền chiết khấu 2
      const discountAmount2 = priceAfterDiscount1 * discount2Percentage;
      
      // Giá sau chiết khấu 2
      const priceAfterDiscount2 = priceAfterDiscount1 - discountAmount2;
      
      // Tính tổng tiền
      const totalPrice = quantity * priceAfterDiscount2;
      tongTienDonHang += totalPrice;

      // Nếu có VAT, tính thêm
      if (saleOrder.crdfd_vatstatus === 191920000) { // Có VAT
        // Tính VAT dựa trên crdfd_ieuchinhgtgt
        let vatRate = 0;
        if (ieuchinhgtgt !== undefined) {
          switch (ieuchinhgtgt) {
            case 191920000: // 0%
              vatRate = 0;
              break;
            case 191920001: // 5%
              vatRate = 0.05;
              break;
            case 191920002: // 8%
              vatRate = 0.08;
              break;
            case 191920003: // 10%
              vatRate = 0.1;
              break;
            default:
              vatRate = 0;
          }
        } else {
          // Mặc định là 10% nếu không có thông tin
          vatRate = 0.1;
        }
        
        sumGTGT += totalPrice * vatRate;
      }
    });

    // Tổng tiền cuối cùng
    const tongTienCuoi = tongTienDonHang - tienChietKhauSO + sumGTGT;

    return `${this.formatCurrency(tongTienCuoi)} đ`;
  }

  // Phương thức định dạng timestamp thành dd/MM/yyyy
  private formatTimestamp(timestamp: number): string {
    // Chuyển timestamp sang date
    console.log("timestamp", timestamp);
    const date = new Date(timestamp);
    console.log("date", date);
    return this.formatDate(date);
  }

  // Phương thức định dạng ngày
  private formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    console.log("dd", dd);
    console.log("MM", MM);
    console.log("yyyy", yyyy);
    return `${dd}/${MM}/${yyyy}`;
  }

  // Phương thức định dạng số
  private formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Phương thức định dạng tiền tệ
  private formatCurrency(num: number): string {
    return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Phương thức lấy text điều khoản thanh toán
  private getDieuKhoanThanhToan(dieukhoan?: number): string {
    const idToTextMapping: Record<number, string> = {
      283640005: "Thanh toán trước khi nhận hàng",
      283640004: "Công nợ 60 ngày",
      283640003: "Công nợ 45 ngày",
      283640002: "Công nợ 30 ngày",
      283640001: "Công nợ 7 ngày",
      283640000: "Tiền mặt",
      30: "Thanh toán vào ngày 5 hàng tháng",
      14: "Thanh toán 2 lần vào ngày 10 và 25",
      0: "Thanh toán sau khi nhận hàng"
    };

    return dieukhoan !== undefined && idToTextMapping[dieukhoan]
      ? idToTextMapping[dieukhoan]
      : "";
  }

  // Phương thức lấy thông tin chuyển khoản
  private getThongTinChuyenKhoan(tinhthanh?: string): string {
    if (tinhthanh === "Sài Gòn") {
      return `
                <p style="font-weight: bold;"> THÔNG TIN CHUYỂN KHOẢN</p>
                <p style="font-weight: bold"> Lê Thị Ngọc Anh</p>
                <p style="font-weight: normal !important;"> Tài khoản : 58010001687927</p>
                <p style="font-weight: normal !important;"> Ngân hàng : BIDV</p>
                <p style="font-weight: normal !important;"> Chi nhánh : Bình Định</p>
            `;
    }
    return "";
  }

  /**
   * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions
   */
  public updateView(context: ComponentFramework.Context<IInputs>): void {
    try {
      // Mỗi lần gọi updateView, tăng sessionId để huỷ các phiên cũ
      this._currentSessionId++;
      const currentSessionId = this._currentSessionId;

      console.log(`===== BẮT ĐẦU UPDATE VIEW [Phiên ${currentSessionId}] =====`);

      // Hiển thị loading indicator
      if (this._loadingIndicator) {
        this._loadingIndicator.style.display = "block";
      }

      // Cập nhật số lượng bản ghi tối đa nếu thay đổi
      const previousMaxRecords = this._maxRecords;
      this._maxRecords = parseInt(context.parameters.MaxRecord.raw || "0");
      console.log("Số lượng bản ghi tối đa cần tải:", this._maxRecords);

      // Truy cập dữ liệu từ dataset
      const saleOrdersDataset = context.parameters.saleOrders;
      const saleOrderDetailsDataset = context.parameters.saleOrderDetails;

      console.log("saleOrdersDataset", saleOrdersDataset);

      console.log("saleOrdersDataset records:", saleOrdersDataset.sortedRecordIds.length);
      console.log("saleOrderDetailsDataset records:", saleOrderDetailsDataset.sortedRecordIds.length);

      // Reset flag loaded nếu MaxRecord thay đổi
      if (previousMaxRecords !== this._maxRecords) {
        this._isDataLoaded = false;
        console.log(`MaxRecord thay đổi từ ${previousMaxRecords} thành ${this._maxRecords}, reset trạng thái tải dữ liệu.`);
      }

      if (saleOrdersDataset.loading || saleOrderDetailsDataset.loading) {
        // Đang tải dữ liệu, hiển thị trạng thái loading
        this._printContent.innerHTML = `
          <div class="info-message">
              <p>Đang tải dữ liệu cơ bản...</p>
          </div>
        `;
        return;
      }

      // Kiểm tra số lượng bản ghi hiện tại với số lượng tối đa
      const currentRecordCount = saleOrderDetailsDataset.sortedRecordIds.length;
      const targetRecordCount = this._maxRecords > 0 ? this._maxRecords : 1000;

      console.log(`Kiểm tra số lượng bản ghi hiện tại: ${currentRecordCount}/${targetRecordCount}`);

      // Nếu đã đủ số lượng bản ghi hoặc không có trang tiếp theo, xử lý và hiển thị ngay
      // Thêm kiểm tra đã tải đủ dữ liệu chưa
      if (currentRecordCount >= targetRecordCount || !saleOrderDetailsDataset.paging.hasNextPage || this._isDataLoaded) {
        console.log(`[Phiên ${currentSessionId}] Đã có đủ số lượng bản ghi (${currentRecordCount}/${targetRecordCount}) hoặc không còn trang tiếp theo, xử lý dữ liệu luôn.`);

        // Đánh dấu đã tải đủ dữ liệu
        this._isDataLoaded = true;

        this.processAndRenderData(saleOrdersDataset, saleOrderDetailsDataset);
        return;
      }

      // Hàm để tải tất cả dữ liệu
      const loadAllData = async () => {
        try {
          // Nếu phiên hiện tại không còn là phiên mới nhất, dừng ngay
          if (currentSessionId !== this._currentSessionId) {
            console.log(`[Phiên ${currentSessionId}] Đã bị huỷ bởi phiên mới hơn ${this._currentSessionId}, dừng tải dữ liệu.`);
            return;
          }

          // Ẩn loading indicator tạm thời
          if (this._loadingIndicator) {
            this._loadingIndicator.style.display = "none";
          }

          // Tải thêm dữ liệu từ saleOrderDetailsDataset nếu còn
          let hasMoreRecords = saleOrderDetailsDataset.paging.hasNextPage;
          let loadingAttempts = 0;
          const maxAttempts = 5; // Giới hạn số lần tải để tránh vòng lặp vô hạn
          const totalRecordsToLoad = this._maxRecords > 0 ? this._maxRecords : 1000; // Mặc định 1000 nếu không có giá trị

          // Log chi tiết các điều kiện để debug
          console.log(`[Phiên ${currentSessionId}] ==== ĐIỀU KIỆN TRƯỚC VÒNG LẶP ====`);
          console.log(`[Phiên ${currentSessionId}] hasMoreRecords:`, hasMoreRecords);
          console.log(`[Phiên ${currentSessionId}] currentRecordCount:`, saleOrderDetailsDataset.sortedRecordIds.length);
          console.log(`[Phiên ${currentSessionId}] targetRecordCount:`, totalRecordsToLoad);
          console.log(`[Phiên ${currentSessionId}] Đã đủ số lượng bản ghi:`, saleOrderDetailsDataset.sortedRecordIds.length >= totalRecordsToLoad);
          console.log(`[Phiên ${currentSessionId}] ===============================`);

          // Kiểm tra lại điều kiện trước khi bắt đầu tải
          if (saleOrderDetailsDataset.sortedRecordIds.length >= totalRecordsToLoad) {
            console.log(`[Phiên ${currentSessionId}] Đã đủ số lượng bản ghi trước khi bắt đầu tải, xử lý dữ liệu luôn.`);
            this._isDataLoaded = true;
            this.processAndRenderData(saleOrdersDataset, saleOrderDetailsDataset);
            return;
          }

          // Hiển thị thông báo đang tải thêm
          if (hasMoreRecords && saleOrderDetailsDataset.sortedRecordIds.length < totalRecordsToLoad) {
            console.log(`[Phiên ${currentSessionId}] ĐIỀU KIỆN ĐÃ THỎA MÃN: Cần tải thêm dữ liệu`);

            this._printContent.innerHTML = `
              <div class="info-message" style="padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 5px; margin: 20px 0;">
                  <h3 style="color: #338da5; margin-bottom: 10px;">Đang tải dữ liệu chi tiết đơn hàng [Phiên ${currentSessionId}]</h3>
                  <p style="font-size: 16px;">Hiện đã tải: ${saleOrderDetailsDataset.sortedRecordIds.length}/${totalRecordsToLoad} bản ghi</p>
                  <p style="font-size: 14px; color: #6c757d;">Vui lòng đợi trong giây lát...</p>
                  <div class="progress-indicator" style="width: 100%; height: 4px; background-color: #e9ecef; margin-top: 15px;">
                      <div style="width: 10%; height: 100%; background-color: #338da5; animation: progress 2s infinite;"></div>
                  </div>
              </div>
              <style>
                  @keyframes progress {
                      0% { width: 10%; }
                      50% { width: 70%; }
                      100% { width: 10%; }
                  }
              </style>
            `;
          } else {
            // Nếu không cần tải thêm, xử lý và hiển thị ngay
            console.log(`[Phiên ${currentSessionId}] ĐIỀU KIỆN KHÔNG THỎA MÃN: Không cần tải thêm dữ liệu`);
            this._isDataLoaded = true;
            this.processAndRenderData(saleOrdersDataset, saleOrderDetailsDataset);
            return;
          }

          // Tiếp tục tải cho đến khi đạt đủ số lượng bản ghi hoặc không còn trang tiếp theo
          while (
            hasMoreRecords &&
            loadingAttempts < maxAttempts &&
            saleOrderDetailsDataset.sortedRecordIds.length < totalRecordsToLoad &&
            currentSessionId === this._currentSessionId // Kiểm tra phiên còn hiện hành không
          ) {
            console.log(`[Phiên ${currentSessionId}] ==== ĐIỀU KIỆN TRONG VÒNG LẶP - LẦN ${loadingAttempts + 1} ====`);
            console.log(`[Phiên ${currentSessionId}] hasMoreRecords:`, hasMoreRecords);
            console.log(`[Phiên ${currentSessionId}] loadingAttempts < maxAttempts:`, loadingAttempts < maxAttempts, `(${loadingAttempts}/${maxAttempts})`);
            console.log(`[Phiên ${currentSessionId}] currentRecords < targetRecords:`, saleOrderDetailsDataset.sortedRecordIds.length < totalRecordsToLoad,
              `(${saleOrderDetailsDataset.sortedRecordIds.length}/${totalRecordsToLoad})`);
            console.log(`[Phiên ${currentSessionId}] Phiên hiện hành:`, currentSessionId === this._currentSessionId);
            console.log(`[Phiên ${currentSessionId}] ===============================`);

            console.log(`[Phiên ${currentSessionId}] Đang tải trang tiếp theo. Lần thử: ${loadingAttempts + 1}/${maxAttempts}`);
            console.log(`[Phiên ${currentSessionId}] Số bản ghi hiện tại: ${saleOrderDetailsDataset.sortedRecordIds.length}/${totalRecordsToLoad}`);
            loadingAttempts++;

            try {
              // Kiểm tra lại phiên hiện hành trước khi tải
              if (currentSessionId !== this._currentSessionId) {
                console.log(`[Phiên ${currentSessionId}] Đã bị huỷ trong quá trình tải, dừng ngay.`);
                return;
              }

              // Thêm đợi 500ms giữa mỗi lần tải để tránh quá tải
              await new Promise(resolve => setTimeout(resolve, 500));

              // Kiểm tra lại phiên hiện hành sau khi đợi
              if (currentSessionId !== this._currentSessionId) {
                console.log(`[Phiên ${currentSessionId}] Đã bị huỷ sau khi đợi, dừng ngay.`);
                return;
              }

              console.log(`[Phiên ${currentSessionId}] Bắt đầu gọi loadNextPage()...`);
              await saleOrderDetailsDataset.paging.loadNextPage();

              // Kiểm tra phiên hiện hành sau khi tải dữ liệu
              if (currentSessionId !== this._currentSessionId) {
                console.log(`[Phiên ${currentSessionId}] Đã bị huỷ sau khi tải dữ liệu, dừng ngay.`);
                return;
              }

              console.log(`[Phiên ${currentSessionId}] Đã tải thêm dữ liệu. Tổng số sau khi tải: ${saleOrderDetailsDataset.sortedRecordIds.length}`);

              // Tính phần trăm hoàn thành
              const percentComplete = Math.min(
                100,
                Math.round((saleOrderDetailsDataset.sortedRecordIds.length / totalRecordsToLoad) * 100)
              );

              // Kiểm tra số lượng bản ghi sau khi tải - nếu bị reset về số nhỏ, có thể đã có phiên mới
              if (saleOrderDetailsDataset.sortedRecordIds.length < 25) {
                console.log(`[Phiên ${currentSessionId}] Phát hiện dữ liệu bị reset (${saleOrderDetailsDataset.sortedRecordIds.length} bản ghi), có thể đã có phiên mới.`);
                return;
              }

              // Cập nhật thông báo
              this._printContent.innerHTML = `
                <div class="info-message" style="padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #338da5; margin-bottom: 10px;">Đang tải dữ liệu chi tiết đơn hàng [Phiên ${currentSessionId}]</h3>
                    <p style="font-size: 16px;">Hiện đã tải: ${saleOrderDetailsDataset.sortedRecordIds.length}/${totalRecordsToLoad} bản ghi</p>
                    <p style="font-size: 14px; color: #6c757d;">Đã tải ${loadingAttempts}/${maxAttempts} trang</p>
                    <div class="progress-indicator" style="width: 100%; height: 4px; background-color: #e9ecef; margin-top: 15px;">
                        <div style="width: ${percentComplete}%; height: 100%; background-color: #338da5;"></div>
                    </div>
                </div>
              `;

              // Kiểm tra xem còn trang tiếp theo không
              const previousHasMoreRecords = hasMoreRecords;
              hasMoreRecords = saleOrderDetailsDataset.paging.hasNextPage;
              console.log(`[Phiên ${currentSessionId}] hasMoreRecords trước/sau: ${previousHasMoreRecords}/${hasMoreRecords}`);

              // Nếu đã đủ số lượng bản ghi, dừng việc tải
              if (saleOrderDetailsDataset.sortedRecordIds.length >= totalRecordsToLoad) {
                console.log(`[Phiên ${currentSessionId}] Đã tải đủ ${totalRecordsToLoad} bản ghi, dừng tải.`);
                this._isDataLoaded = true;
                break;
              }
            } catch (error) {
              console.error(`[Phiên ${currentSessionId}] Lỗi khi tải trang tiếp theo:`, error);
              this._printContent.innerHTML = `
                <div class="error-message" style="padding: 20px; text-align: center; background-color: #f8d7da; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #721c24; margin-bottom: 10px;">Lỗi khi tải dữ liệu</h3>
                    <p style="font-size: 16px;">Không thể tải thêm dữ liệu.</p>
                    <p style="font-size: 14px; color: #6c757d;">Đã tải được ${saleOrderDetailsDataset.sortedRecordIds.length} bản ghi.</p>
                </div>
              `;
              // Đợi 2 giây để người dùng đọc thông báo
              await new Promise(resolve => setTimeout(resolve, 2000));
              break;
            }
          }

          // Kiểm tra phiên hiện hành trước khi xử lý dữ liệu
          if (currentSessionId !== this._currentSessionId) {
            console.log(`[Phiên ${currentSessionId}] Đã bị huỷ sau khi tải xong dữ liệu, không xử lý dữ liệu.`);
            return;
          }

          // Không cần hiển thị thông báo hoàn tất, chuyển trực tiếp sang xử lý dữ liệu
          console.log(`[Phiên ${currentSessionId}] Đã tải xong dữ liệu, chuyển sang xử lý.`);

          // Đánh dấu đã tải đủ dữ liệu
          this._isDataLoaded = true;

          // Hiển thị loading indicator lại
          if (this._loadingIndicator) {
            this._loadingIndicator.style.display = "block";
          }

          // Tiếp tục xử lý dữ liệu sau khi tải xong
          this.processAndRenderData(saleOrdersDataset, saleOrderDetailsDataset);
        } catch (error) {
          console.error(`[Phiên ${currentSessionId}] Lỗi khi tải dữ liệu:`, error);
          this._printContent.innerHTML = `
            <div class="error-message" style="padding: 20px; text-align: center; background-color: #f8d7da; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #721c24; margin-bottom: 10px;">Lỗi khi tải dữ liệu</h3>
                <p style="font-size: 16px;">Vui lòng thử lại sau.</p>
            </div>
          `;
        }
      };

      // Gọi hàm tải dữ liệu
      loadAllData();
      console.log(`===== KẾT THÚC UPDATE VIEW [Phiên ${currentSessionId}] =====`);
    } catch (error) {
      console.error("Lỗi không xác định trong updateView:", error);
      this._printContent.innerHTML = `
        <div class="error-message" style="padding: 20px; text-align: center; background-color: #f8d7da; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #721c24; margin-bottom: 10px;">Lỗi không xác định</h3>
            <p style="font-size: 16px;">Đã xảy ra lỗi không xác định khi cập nhật giao diện.</p>
        </div>
      `;
    }
  }

  // Tách phần xử lý và render dữ liệu thành một hàm riêng
  private processAndRenderData(
    saleOrdersDataset: ComponentFramework.PropertyTypes.DataSet,
    saleOrderDetailsDataset: ComponentFramework.PropertyTypes.DataSet
  ): void {
    try {
      console.log("===== BẮT ĐẦU XỬ LÝ DỮ LIỆU =====");
      // Ẩn loading indicator
      if (this._loadingIndicator) {
        this._loadingIndicator.style.display = "none";
      }

      // Kiểm tra nếu có dữ liệu
      if (saleOrdersDataset.sortedRecordIds.length > 0) {
        // Lấy bản ghi đầu tiên từ dataset saleOrders
        const saleOrderId = saleOrdersDataset.sortedRecordIds[0];
        const saleOrder = saleOrdersDataset.records[saleOrderId];

        // Log thông tin dataset để debug
        console.log("===== DATASET INFO =====");
        console.log("Sale Orders Dataset Total Records:", saleOrdersDataset.sortedRecordIds.length);
        console.log("Sale Order Details Dataset Total Records:", saleOrderDetailsDataset.sortedRecordIds.length);

        // Đọc giá trị từ bản ghi
        const orderData: ISaleOrder = {
          crdfd_sale_orderid: this.getFormattedValue(saleOrder, "crdfd_sale_orderid"),
          crdfd_name: this.getFormattedValue(saleOrder, "crdfd_name"),
          crdfd_tenthuongmai_text: this.getFormattedValue(saleOrder, "crdfd_tenthuongmai_text"),
          crdfd_khachhangtext: this.getFormattedValue(saleOrder, "crdfd_khachhangtext"),
          crdfd_vatstatus: this.getNumberValue(saleOrder, "crdfd_vatstatus"),
          createdon: this.getFormattedValue(saleOrder, "createdon"),
          diachi: this.getFormattedValue(saleOrder, "crdfd_iachitext") || "",
          sdt: this.getFormattedValue(saleOrder, "crdfd_sttext") || "",
          ghichu: this.getFormattedValue(saleOrder, "crdfd_notes") || "",
          dieukhoan: this.getNumberValue(saleOrder, "crdfd_dieu_khoan_thanh_toan"),
          tinhthanh: this.getFormattedValue(saleOrder, "crdfd_localtext") || ""
        };
        console.log("orderData", orderData);
        // Lấy tất cả các chi tiết đơn hàng
        // Kiểm tra số lượng bản ghi nhận được
        const orderDetails: ISaleOrderDetail[] = [];
        const totalDetails = saleOrderDetailsDataset.sortedRecordIds.length;

        console.log(`Đang xử lý ${totalDetails} chi tiết đơn hàng`);

        // Lấy toàn bộ records từ dataset
        for (let i = 0; i < totalDetails; i++) {
          const id = saleOrderDetailsDataset.sortedRecordIds[i];
          const detail = saleOrderDetailsDataset.records[id];

          orderDetails.push({
            productName: this.getFormattedValue(detail, "crdfd_tensanphamtext"),
            discount: this.getFormattedValue(detail, "crdfd_chieckhau"),
            quantity: this.getFormattedValue(detail, "crdfd_productnum"),
            price: this.getFormattedValue(detail, "crdfd_giagoc"),
            deliveryDate: this.getFormattedValue(detail, "crdfd_ngaygiaodukientonghop"),
            donvitinh: this.getFormattedValue(detail, "crdfd_onvionhang"),
            discount2: this.getFormattedValue(detail, "crdfd_chieckhau2"),
            ieuchinhgtgt: this.getNumberValue(detail, "crdfd_ieuchinhgtgt"),
            chieckhauvn: this.getNumberValue(detail, "crdfd_chieckhauvn")
          });
        }
        console.log("orderDetails", orderDetails);
        console.log(`Đã xử lý ${orderDetails.length}/${totalDetails} chi tiết đơn hàng`);

        // Render form với dữ liệu lấy được
        this.renderForm(orderData, orderDetails);

        // Đảm bảo cuộn xuống cuối để hiển thị hết nội dung
        setTimeout(() => {
          const container = document.querySelector('.print-form-container') as HTMLElement;
          if (container) {
            container.scrollTop = 0; // Reset scroll position trước
          }
        }, 100);
      } else {
        console.warn("Không nhận được dữ liệu từ dataset");
        this._printContent.innerHTML = `
          <div class="error-message">
              <p>Không có dữ liệu từ dataset. Vui lòng kiểm tra cấu hình dataset trong Canvas App.</p>
          </div>
        `;
      }
      console.log("===== KẾT THÚC XỬ LÝ DỮ LIỆU =====");
    } catch (error) {
      console.error("Lỗi khi xử lý và hiển thị dữ liệu:", error);
      this._printContent.innerHTML = `
        <div class="error-message" style="padding: 20px; text-align: center; background-color: #f8d7da; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #721c24; margin-bottom: 10px;">Lỗi khi xử lý dữ liệu</h3>
            <p style="font-size: 16px;">Đã xảy ra lỗi khi xử lý và hiển thị dữ liệu.</p>
        </div>
      `;
    }
  }

  /**
   * It is called by the framework prior to a control receiving new data.
   * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
   */
  public getOutputs(): IOutputs {
    return {};
  }

  /**
   * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
   * i.e. cancelling any pending remote calls, removing listeners, etc.
   */
  public destroy(): void {
    console.log("=== Component bị hủy ===");
    // Cleanup
  }

  // Các phương thức sửa đổi
  private getStringValue(record: ComponentFramework.WebApi.Entity, key: string): string {
    return record.getValue(key) as string || '';
  }

  private getNumberValue(record: ComponentFramework.WebApi.Entity, key: string): number {
    return record.getValue(key) as number || 0;
  }

  private getDateValue(record: ComponentFramework.WebApi.Entity, key: string): Date | null {
    const value = record.getValue(key);
    return value ? new Date(value as string) : null;
  }

  private getBooleanValue(record: ComponentFramework.WebApi.Entity, key: string): boolean {
    return record.getValue(key) as boolean || false;
  }

  private getFormattedValue(record: ComponentFramework.WebApi.Entity, key: string): string {
    return record.getFormattedValue(key) || '';
  }
}
