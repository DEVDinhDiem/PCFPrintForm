import { json } from "stream/consumers";
import { IInputs, IOutputs } from "./generated/ManifestTypes";

// Interface cho Sale Order
interface ISaleOrder {
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
}

// Interface cho Contact
interface IContact {
  crdfd_name: string;
  crdfd_mail: string;
}

export class PrintForm implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private _container: HTMLDivElement;
  private _context: ComponentFramework.Context<IInputs>;
  private _IDBanHang: string;
  private _printButton: HTMLButtonElement;
  private _printContent: HTMLDivElement;
  private _notifyOutputChanged: () => void;
  private _loadingIndicator: HTMLDivElement;

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
    this._IDBanHang = context.parameters.IDBanHang.raw || "";

    // Tạo UI
    this.createUI();
  }

  private createUI(): void {
    // Tạo container chính
    const mainContainer = document.createElement("div");
    mainContainer.className = "print-form-container";

    // Tạo button Print
    this._printButton = document.createElement("button");
    // this._printButton.innerHTML = "In";
    // this._printButton.className = "print-button";
    this._printButton.onclick = this.handlePrint.bind(this);

    // Tạo loading indicator
    this._loadingIndicator = document.createElement("div");
    this._loadingIndicator.className = "loading-indicator";
    this._loadingIndicator.innerHTML = "Đang tải dữ liệu...";
    this._loadingIndicator.style.display = "none";

    // Tạo container cho nội dung form
    this._printContent = document.createElement("div");
    this._printContent.className = "print-content";

    // Thêm các elements vào container
    mainContainer.appendChild(this._printButton);
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

    // 4. Thêm script element riêng biệt
    const scriptElement = document.createElement("script");
    scriptElement.type = "text/javascript";
    scriptElement.textContent = scriptContent;
    this._printContent.appendChild(scriptElement);

    // 5. Gắn sự kiện in cho nút in
    const printButton = this._printContent.querySelector('#btnClick');
    if (printButton) {
      printButton.addEventListener('click', this.handlePrint.bind(this));
    }
  }

  // Phương thức tạo HTML
  private generateFormHTML(saleOrder: ISaleOrder, saleOrderDetails: ISaleOrderDetail[]): string {
    // Lấy ngày hiện tại
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayString = `ngày ${dd} tháng ${mm} năm ${yyyy}`;

    return `
<html>
<head>
    <title>${saleOrder.crdfd_name}</title>
    <meta charset='UTF-8'>
    <link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <style>
      p {
        margin: 0 0 0px !important;
      }

      table {
        margin: 0 0 0px !important;
      }

      .table > tbody > tr > td,
      .table > tbody > tr > th,
      .table > tfoot > tr > td,
      .table > tfoot > tr > th,
      .table > thead > tr > td,
      .table > thead > tr > th {
        padding: 2px !important;
      }

      .table > tbody > tr > td,
      .table > tbody > tr > th,
      .table > tfoot > tr > td,
      .table > tfoot > tr > th,
      .table > thead > tr > td,
      .table > thead > tr > th {
        border-top: 0px !important;
      }

      .table-bordered > tbody > tr > td,
      .table-bordered > tbody > tr > th,
      .table-bordered > tfoot > tr > td,
      .table-bordered > tfoot > tr > th,
      .table-bordered > thead > tr > td,
      .table-bordered > thead > tr > th {
        border: 1px solid #000000 !important;
      }

      .table > tbody + tbody {
        border-top: 1px solid #ddd !important;
      }

      @media print {
        body {
          zoom: 85%;
        }
        .no-print {
          display: none !important;
        }
      }

      @media screen, print {
        #colorTitle {
          background-color: #338da5 !important;
          color: #ffffff !important;
        }
      }
      
      .btn-action {
        padding: 10px 15px;
        margin: 10px 5px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
      }
      
      .btn-print {
        background-color: #337ab7;
        color: white;
      }
      
      .btn-export-pdf {
        background-color: #d9534f;
        color: white;
      }
      
      .action-buttons {
        text-align: center;
        margin: 20px 0;
      }
    </style>
</head>

<body>
    <div class='container' style='font-family: undefined'>
      <div class="action-buttons no-print">
        <button id="btnPrint" class="btn-action btn-print" onclick="window.print()">In</button>
        <button id="btnClick" class="btn-action btn-export-pdf">Xuất PDF</button>
      </div>
      <div class='row'>
        <div class='table-responsive'>
          <table class='table'>
            <tbody>
              <tr class='tt'>
                <td width='20%' style='vertical-align: middle'>
                  <img src='https://wecare-ii.crm5.dynamics.com/WebResources/crdfd_logo' title='Weshop' alt='Weshop' class='img-responsive' style='
                      width: 150px;
                      height: 140px;
                      float: right;
                      margin-right: 25px;
                    '>
                </td>
                <td id='name_shop' width='20%' style='
                    text-align: left;
                    vertical-align: middle;
                    font-size: 30;
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
          <table class='table table-bordered'>
            <tbody style='font-size: 20px; padding: 1px; text-align: center'>
              <tr class='tt'>
                <th style='text-align: center; vertical-align: middle; width: 3% !important;' id='colorTitle'>STT</th>
                <th style='text-align: center; vertical-align: middle; width: 20% !important;' id='colorTitle'>Tên sản phẩm</th>
                <th style='text-align: center; vertical-align: middle; width: 5% !important;' id='colorTitle'>VAT</th>
                <th style='text-align: center; vertical-align: middle; width: 7% !important;' id='colorTitle'>CK1</th>
                <th style='text-align: center; vertical-align: middle; width: 7% !important;' id='colorTitle'>CK2</th>
                <th style='text-align: center; vertical-align: middle; width: 10% !important;' id='colorTitle'>ĐVT</th>
                <th style='text-align: center; vertical-align: middle; width: 7% !important;' id='colorTitle'>Số lượng</th>
                <th style='text-align: center; vertical-align: middle; width: 10% !important;' id='colorTitle'>Đơn giá</th>
                <th style='text-align: center; vertical-align: middle; width: 15% !important;' id='colorTitle'>Đơn giá sau CK</th>
                <th style='text-align: center; vertical-align: middle; width: 12% !important;' id='colorTitle'>Thành tiền</th>
                <th style='text-align: center; margin: 0 0 0 0px; width: 11% !important;' id='colorTitle'>Ngày giao dự kiến</th>
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
          <table class='table' style='font-size: 20px; border: none'>
            <tbody>
              <tr>
                <th class='col-sm-4'>
                  Điều khoản thanh toán
                  <p id='HTTT' style='font-weight: normal !important'>${this.getDieuKhoanThanhToan(saleOrder.dieukhoan)}</p>
                  <p></p>
                  <br>
                  <div id='chuyenkhoan'>${this.getThongTinChuyenKhoan(saleOrder.tinhthanh)}</div>
                </th>

                <th class='col-sm-4' style='text-align: center'>
                  Ngày đặt hàng
                  <p id='NDH' style='font-weight: normal !important'>${this.formatTimestamp(new Date(saleOrder.createdon).getTime())}</p>
                </th>
                <th class='col-sm-4' style='text-align: center'>
                  Thời gian giao hàng dự kiến
                </th>
                    </tr>
            </tbody>
          </table>
        </div>
      </div>
      <br>
      <div class='row' id='title_wc'>
      ${saleOrder.crdfd_tenthuongmai_text === 'WECARE' ?
        `<p style='font-size: 20px;'>
          <b class='tt-ft'>Về Wecare:</b><br>
          Chúng tôi mong muốn hỗ trợ các công ty, nhà máy, đơn vị xây dựng,
          thiết kế có được những sự lựa chọn đáng tin cậy cho các giải pháp về phụ kiện phụ trợ,
          để các doanh nghiệp có thể yên tâm &amp; toàn tâm trong sản phẩm chính của mình.
      </p>` : ''}
      </div>
      <br>
      <div class='row'>
        <div class='table-responsive'>
          <table class='table' style='font-size: 20px; border: none'>
                <tbody>
              <tr>
                <th class='col-sm-4' style='text-align: center'>
                  <img src='https://wecare-ii.crm5.dynamics.com/WebResources/new_qrcodenew' style='width: 100px; height: 100px'>
                  <p>https://wecare.com.vn</p>
                </th>
                <th class='col-sm-4' style='text-align: center'>Bên mua</th>
                <th class='col-sm-4' style='text-align: center'>
                  Bên bán
                  <br>
                  <br>
                  <br>
                  <br>
                  <br>
                </th>
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

  // Phương thức tạo JavaScript
  private generateFormScript(saleOrder: ISaleOrder, saleOrderDetails: ISaleOrderDetail[]): string {
    return `
function myFunction() {
    // Lấy phần tử container chứa form
    var element = document.querySelector('.container');
    
    if (!element) {
        console.error('Không tìm thấy form container');
        return;
    }

    var opt = {
        margin: 1,
        filename: '${saleOrder.crdfd_name || "DonHang"}.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            // Chỉ chụp phần tử container
            windowWidth: element.offsetWidth,
            windowHeight: element.offsetHeight
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Sử dụng html2pdf để xuất file PDF
    html2pdf().from(element).set(opt).save();
}

function handlePrint() {
    // Lấy nội dung hiện tại của form
    var element = document.querySelector('.container');
    if (!element) {
        console.error('Không tìm thấy form container');
        return;
    }

    // Tạo một div mới để chứa nội dung in
    var printContent = element.cloneNode(true);
    
    // Tạo một iframe mới
    var printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.left = '-9999px';
    document.body.appendChild(printFrame);
    
    // Ghi nội dung vào iframe
    var frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write('<html><head>');
    
    // Copy các style từ trang gốc
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(styleSheet => {
        frameDoc.write(styleSheet.outerHTML);
    });
    
    frameDoc.write('</head><body>');
    frameDoc.write(printContent.outerHTML);
    frameDoc.write('</body></html>');
    frameDoc.close();
    
    // Đợi tải xong các resource
    printFrame.onload = function() {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        // Xóa iframe sau khi in xong
        setTimeout(function() {
            document.body.removeChild(printFrame);
        }, 500);
    };
}

// Thêm thư viện html2pdf vào trang
function addHtml2PdfLib() {
    if (!document.getElementById('html2pdf-script')) {
        var script = document.createElement('script');
        script.id = 'html2pdf-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = function() {
            // Khi thư viện đã tải xong, gắn sự kiện cho nút
            document.getElementById('btnClick').addEventListener('click', myFunction);
            document.getElementById('btnPrint').addEventListener('click', handlePrint);
        };
        document.head.appendChild(script);
    } else {
        // Nếu thư viện đã tồn tại, chỉ gắn sự kiện
        document.getElementById('btnClick').addEventListener('click', myFunction);
        document.getElementById('btnPrint').addEventListener('click', handlePrint);
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
      const price = parseFloat(detail.price) || 0;
      const discount1 = parseFloat(detail.discount) || 0;
      const discount2 = parseFloat(detail.discount2 || '0') || 0;

      // Tính giá sau chiết khấu 1
      const priceAfterDiscount1 = price * (1 - discount1);

      // Tính giá sau chiết khấu 2
      const priceAfterDiscount2 = priceAfterDiscount1 * (1 - discount2);

      // Tính thành tiền
      const totalPrice = quantity * priceAfterDiscount2;

      // Ngày giao dự kiến
      const deliveryDate = detail.deliveryDate ? this.formatTimestamp(new Date(detail.deliveryDate).getTime()) : '';

      html += `
            <tr>
                <td style='text-align: center;'>${index + 1}</td>
                <td style='text-align: left;'>${detail.productName}</td>
                <td style='text-align: center;'>10%</td>
                <td style='text-align: center;'>${(discount1 * 100).toFixed(1)}%</td>
                <td style='text-align: center;'>${(discount2 * 100).toFixed(1)}%</td>
                <td style='text-align: center;'>${detail.donvitinh || 'Cái'}</td>
                <td style='text-align: right; padding-right: 5px !important;'>${this.formatNumber(quantity)}</td>
                <td style='text-align: right; padding-right: 5px !important;'>${this.formatCurrency(price)} đ</td>
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
      const price = parseFloat(detail.price) || 0;
      const discount1 = parseFloat(detail.discount) || 0;
      const discount2 = parseFloat(detail.discount2 || '0') || 0;

      // Tính giá sau chiết khấu 1
      const priceAfterDiscount1 = price * (1 - discount1);

      // Tính giá sau chiết khấu 2
      const priceAfterDiscount2 = priceAfterDiscount1 * (1 - discount2);

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
        const price = parseFloat(detail.price) || 0;
        const discount1 = parseFloat(detail.discount) || 0;
        const discount2 = parseFloat(detail.discount2 || '0') || 0;

        // Tính giá sau chiết khấu
        const priceAfterDiscount1 = price * (1 - discount1);
        const priceAfterDiscount2 = priceAfterDiscount1 * (1 - discount2);

        // Tính tổng tiền và VAT
        const totalPrice = quantity * priceAfterDiscount2;
        sumGTGT += totalPrice * 0.1; // Giả sử VAT 10%
      });
    }

    return `${this.formatCurrency(sumGTGT)} đ`;
  }

  // Tính tổng tiền cuối cùng
  private calculateFinalTotal(saleOrder: ISaleOrder, details: ISaleOrderDetail[]): string {
    let tongTienDonHang = 0;
    let sumGTGT = 0;
    const tienChietKhauSO = 0; // Tiền chiết khấu của đơn hàng

    details.forEach(detail => {
      const quantity = parseFloat(detail.quantity) || 0;
      const price = parseFloat(detail.price) || 0;
      const discount1 = parseFloat(detail.discount) || 0;
      const discount2 = parseFloat(detail.discount2 || '0') || 0;

      // Tính giá sau chiết khấu
      const priceAfterDiscount1 = price * (1 - discount1);
      const priceAfterDiscount2 = priceAfterDiscount1 * (1 - discount2);

      // Tính tổng tiền
      const totalPrice = quantity * priceAfterDiscount2;
      tongTienDonHang += totalPrice;

      // Nếu có VAT, tính thêm
      if (saleOrder.crdfd_vatstatus === 191920000) { // Có VAT
        sumGTGT += totalPrice * 0.1; // Giả sử VAT 10%
      }
    });

    // Tổng tiền cuối cùng
    const tongTienCuoi = tongTienDonHang - tienChietKhauSO + sumGTGT;

    return `${this.formatCurrency(tongTienCuoi)} đ`;
  }

  // Phương thức định dạng timestamp thành dd/mm/yyyy
  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return this.formatDate(date);
  }

  // Phương thức định dạng ngày
  private formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
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

  private handlePrint(): void {
    // Chức năng in sẽ được xử lý trong generateFormHTML và generateFormScript
    console.log("Nút in đã được nhấn");
  }

  /**
   * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
   * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
   */
  public updateView(context: ComponentFramework.Context<IInputs>): void {
    // Hiển thị loading indicator
    if (this._loadingIndicator) {
      this._loadingIndicator.style.display = "block";
    }

    // Cập nhật ID đơn hàng nếu thay đổi
    this._IDBanHang = context.parameters.IDBanHang.raw || "";

    // Truy cập dữ liệu từ dataset
    const saleOrdersDataset = context.parameters.saleOrders;
    const saleOrderDetailsDataset = context.parameters.saleOrderDetails;

    if (saleOrdersDataset.loading || saleOrderDetailsDataset.loading) {
      // Đang tải dữ liệu, hiển thị trạng thái loading
      this._printContent.innerHTML = `
                <div class="info-message">
                    <p>Đang tải dữ liệu...</p>
                </div>
            `;
      return;
    }

    // Ẩn loading indicator
    if (this._loadingIndicator) {
      this._loadingIndicator.style.display = "none";
    }

    // Kiểm tra nếu có dữ liệu
    if (saleOrdersDataset.sortedRecordIds.length > 0) {

      // Lấy bản ghi đầu tiên từ dataset saleOrders
      const saleOrderId = saleOrdersDataset.sortedRecordIds[0];
      const saleOrder = saleOrdersDataset.records[saleOrderId];

      // Log bản ghi đầu tiên để xem cấu trúc chi tiết và các cột có sẵn
      console.log("===== FIRST RECORDS INSPECTION =====");

      // Đọc giá trị từ bản ghi
      const orderData: ISaleOrder = {
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

      console.log("Final orderData for rendering:", orderData);

      // Lấy tất cả các chi tiết đơn hàng
      const orderDetails = saleOrderDetailsDataset.sortedRecordIds.map(id => {
        const detail = saleOrderDetailsDataset.records[id];

        return {
          productName: this.getFormattedValue(detail, "crdfd_tensanphamtext"),
          discount: this.getFormattedValue(detail, "crdfd_chieckhau"),
          quantity: this.getFormattedValue(detail, "crdfd_productnum"),
          price: this.getFormattedValue(detail, "crdfd_giagoc"),
          // Thêm các trường thông tin khác
          deliveryDate: this.getFormattedValue(detail, "crdfd_ngaygiaodukientonghop"),
          donvitinh: this.getFormattedValue(detail, "crdfd_onvionhang"),
          discount2: this.getFormattedValue(detail, "crdfd_chieckhau2")
        };
      });

      console.log("Final orderDetails for rendering:", orderDetails);

      // Render form với dữ liệu lấy được
      this.renderForm(orderData, orderDetails);
    } else {
      console.warn("Không nhận được dữ liệu từ dataset");
      this._printContent.innerHTML = `
                <div class="error-message">
                    <p>Không có dữ liệu từ dataset. Vui lòng kiểm tra cấu hình dataset trong Canvas App.</p>
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
