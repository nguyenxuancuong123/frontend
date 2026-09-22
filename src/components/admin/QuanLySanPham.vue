<template>
  <div class="ql-wrapper">
    <div class="ql-header">
      <div>
        <h3>Quản lý sản phẩm</h3>
        <p class="ql-sub">Tổng số: {{ products.length }} sản phẩm</p>
      </div>
      <button class="btn-primary" @click="openModal(null)">+ Thêm sản phẩm</button>
    </div>

    <div v-if="loading" class="loading">Đang tải dữ liệu...</div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Hình ảnh</th>
            <th>Tên sản phẩm</th>
            <th>Danh mục</th>
            <th>Giá bán</th>
            <th class="col-action">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.maSP">
            <td class="fw-id">#{{ product.maSP }}</td>
            <td>
              <div class="product-thumb">
                <img v-if="product.hinhAnh" :src="'http://localhost:8080/images/' + product.hinhAnh" :alt="product.tenSP" />
                <div v-else class="no-img">N/A</div>
              </div>
            </td>
            <td class="cell-name">{{ product.tenSP }}</td>
            <td><span class="category-badge">{{ product.danhMuc?.tenDM || '—' }}</span></td>
            <td class="price">{{ formatPrice(product.giaBan) }}</td>
            <td class="col-action">
              <button class="btn-action btn-edit" @click="openModal(product)">Sửa</button>
              <button class="btn-action btn-delete" @click="deleteProduct(product.maSP)">Xóa</button>
            </td>
          </tr>
          <tr v-if="products.length === 0">
            <td colspan="8" class="empty-row">Chưa có sản phẩm nào</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <h4>{{ isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới' }}</h4>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>

        <form @submit.prevent="saveProduct" class="modal-body">
          <!-- Image Upload -->
          <div class="form-group">
            <label>Hình ảnh sản phẩm</label>
            <div class="image-upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="onDrop">
              <img v-if="imagePreview" :src="imagePreview" class="preview-img" alt="preview" />
              <div v-else class="upload-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p>Nhấp hoặc kéo thả ảnh vào đây</p>
                <span>PNG, JPG, WEBP — Tối đa 5MB</span>
              </div>
            </div>
            <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
            <div v-if="imagePreview" class="image-actions">
              <button type="button" class="btn-change-img" @click="triggerFileInput">Đổi ảnh</button>
              <button type="button" class="btn-remove-img" @click="removeImage">Xóa ảnh</button>
            </div>
          </div>

          <!-- Tên SP -->
          <div class="form-group">
            <label>Tên sản phẩm <span class="required">*</span></label>
            <input v-model="formData.tenSP" type="text" required placeholder="Nhập tên sản phẩm..." />
          </div>

          <!-- Giá bán + Giá KM -->
          <div class="form-row">
            <div class="form-group half">
              <label>Giá bán (₫) <span class="required">*</span></label>
              <input v-model="formData.giaBan" type="number" min="0" required placeholder="0" />
            </div>
            <div class="form-group half">
              <label>Giá khuyến mãi (₫)</label>
              <input v-model="formData.giaKhuyenMai" type="number" min="0" placeholder="Không bắt buộc" />
            </div>
          </div>

          <!-- Số lượng tồn + Danh mục -->
          <div class="form-row">
            <div class="form-group half">
              <label>Số lượng tồn <span class="required">*</span></label>
              <input v-model="formData.soLuongTon" type="number" min="0" required placeholder="0" />
            </div>
            <div class="form-group half">
              <label>Danh mục <span class="required">*</span></label>
              <select v-model="formData.maDM" required>
                <option value="" disabled>Chọn danh mục...</option>
                <option v-for="cat in categories" :key="cat.maDM" :value="cat.maDM">{{ cat.tenDM }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Mô tả sản phẩm</label>
            <textarea v-model="formData.moTa" rows="4" placeholder="Nhập mô tả..."></textarea>
          </div>

          <div v-if="saveError" class="save-error">{{ saveError }}</div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal">Hủy</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <span v-if="saving" class="spinner"></span>
              {{ saving ? 'Đang lưu...' : 'Lưu sản phẩm' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/axios';

export default {
  name: 'QuanLySanPham',
  data() {
    return {
      products: [],
      categories: [],
      loading: true,
      isModalOpen: false,
      isEdit: false,
      saving: false,
      saveError: null,
      imagePreview: null,
      imageFile: null,
      formData: {
        maSP: null,
        tenSP: '',
        giaBan: '',
        giaKhuyenMai: '',
        soLuongTon: 0,
        moTa: '',
        maDM: ''
      }
    };
  },
  mounted() { this.fetchData(); },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const [prodRes, catRes] = await Promise.all([
          // API đúng: GET /api/v1/admin/product/listproduct
          api.get('/api/v1/admin/product/listproduct'),
          // API đúng: GET /api/v1/admin/category/listcategory
          api.get('/api/v1/admin/category/listcategory')
        ]);
        this.products = prodRes.data;
        this.categories = catRes.data;
      } catch { alert('Lỗi tải dữ liệu sản phẩm.'); }
      finally { this.loading = false; }
    },
    formatPrice(price) {
      if (!price) return '0 ₫';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    },
    triggerFileInput() { this.$refs.fileInput.click(); },
    onFileChange(e) {
      const file = e.target.files[0];
      if (file) this.readFile(file);
    },
    onDrop(e) {
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('images/')) this.readFile(file);
    },
    readFile(file) {
      if (file.size > 5 * 1024 * 1024) { alert('Ảnh không được vượt quá 5MB!'); return; }
      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => { this.imagePreview = e.target.result; };
      reader.readAsDataURL(file);
    },
    removeImage() {
      this.imagePreview = null;
      this.imageFile = null;
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },
    openModal(product) {
      this.saveError = null;
      this.imageFile = null;
      if (product) {
        this.isEdit = true;
        this.formData = {
          maSP: product.maSP,
          tenSP: product.tenSP,
          giaBan: product.giaBan,
          giaKhuyenMai: product.giaKhuyenMai || '',
          soLuongTon: product.soLuongTon ?? product.soLuong ?? 0,
          moTa: product.moTa || '',
          maDM: product.danhMuc?.maDM || ''
        };
        this.imagePreview = product.hinhAnh ? 'http://localhost:8080/images/' + product.hinhAnh : null;
      } else {
        this.isEdit = false;
        this.formData = { maSP: null, tenSP: '', giaBan: '', giaKhuyenMai: '', soLuongTon: 0, moTa: '', maDM: '' };
        this.imagePreview = null;
      }
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
      this.imageFile = null;
      this.imagePreview = null;
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },
    async saveProduct() {
      this.saving = true;
      this.saveError = null;
      try {
        const formData = new FormData();
        const productData = {
          tenSP:         this.formData.tenSP,
          giaBan:        this.formData.giaBan,
          giaKhuyenMai:  this.formData.giaKhuyenMai || null,
          soLuongTon:    Number(this.formData.soLuongTon) || 0,
          soLuong:       Number(this.formData.soLuongTon) || 0,
          moTa:          this.formData.moTa,
          danhMuc:       { maDM: this.formData.maDM }
        };
        
        if (this.imageFile) {
          formData.append("file", this.imageFile);
        }

        if (this.isEdit) {
          productData.maSP = this.formData.maSP;
          formData.append("sanPham", new Blob([JSON.stringify(productData)], { type: "application/json" }));
          await api.put(`/api/v1/admin/product/${productData.maSP}`, formData);
        } else {
          formData.append("product", new Blob([JSON.stringify(productData)], { type: "application/json" }));
          await api.post('/api/v1/admin/product/createproduct', formData);
        }
        
        await this.fetchData();
        this.closeModal();
      } catch (err) {
        this.saveError = err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm!';
      } finally {
        this.saving = false;
      }
    },
    async deleteProduct(id) {
      if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
      try {
        // API đúng: DELETE /api/v1/admin/product/{masp}
        await api.delete(`/api/v1/admin/product/${id}`);
        await this.fetchData();
      } catch { alert('Xóa thất bại. Sản phẩm có thể đang nằm trong đơn hàng.'); }
    }
  }
};
</script>

<style scoped>
.ql-wrapper { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.ql-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0; }
.ql-header h3 { font-size:18px; font-weight:700; color:#1e293b; }
.ql-sub { color:#64748b; font-size:13px; margin-top:4px; }
.btn-primary { background:#3b82f6; color:#fff; border:none; border-radius:8px; padding:10px 18px; font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; transition:.2s; }
.btn-primary:hover { background:#2563eb; }
.btn-primary:disabled { opacity:.7; cursor:not-allowed; }
.btn-secondary { background:#f1f5f9; color:#475569; border:none; border-radius:8px; padding:10px 18px; font-size:14px; font-weight:600; cursor:pointer; transition:.2s; }
.btn-secondary:hover { background:#e2e8f0; }
.table-wrapper { flex: 1; overflow-y: auto; overflow-x: auto; }
.data-table { width:100%; border-collapse:collapse; font-size:14px; }
.data-table th { position: sticky; top: 0; background: #fff; z-index: 2; text-align: left; padding: 12px 14px; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
.data-table td { padding:12px 14px; border-bottom:1px solid #f8fafc; color:#334155; vertical-align:middle; }
.fw-id { font-weight:700; color:#94a3b8; }
.cell-name { font-weight:600; color:#1e293b; max-width:200px; }
.price { font-weight:700; color:#1e293b; }
.category-badge { background:#f1f5f9; padding:3px 10px; border-radius:12px; font-size:12px; color:#475569; white-space:nowrap; }
.product-thumb { width:48px; height:48px; border-radius:10px; overflow:hidden; background:#f8fafc; border:1px solid #e2e8f0; }
.product-thumb img { width:100%; height:100%; object-fit:cover; }
.no-img { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:10px; color:#94a3b8; font-weight:bold; }
.col-action { white-space:nowrap; text-align:right; }
.btn-action { border:none; border-radius:6px; padding:6px 13px; font-size:13px; font-weight:600; cursor:pointer; margin-left:8px; transition:.15s; }
.btn-edit { background:#eff6ff; color:#3b82f6; } .btn-edit:hover { background:#dbeafe; }
.btn-delete { background:#fef2f2; color:#ef4444; } .btn-delete:hover { background:#fee2e2; }
.empty-row { text-align:center !important; padding:32px !important; color:#94a3b8; }
.modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.6); display:flex; align-items:center; justify-content:center; z-index:50; padding:16px; }
.modal-box { background:#fff; border-radius:18px; width:100%; max-width:560px; max-height:92vh; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.18); }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px 0; flex-shrink:0; }
.modal-header h4 { font-size:18px; color:#1e293b; font-weight:700; }
.modal-close { border:none; background:none; font-size:26px; color:#94a3b8; cursor:pointer; line-height:1; }
.modal-close:hover { color:#1e293b; }
.modal-body { padding:20px 24px 24px; overflow-y:auto; }
.image-upload-area { border:2px dashed #cbd5e1; border-radius:12px; cursor:pointer; overflow:hidden; transition:border-color .2s; min-height:150px; display:flex; align-items:center; justify-content:center; }
.image-upload-area:hover { border-color:#3b82f6; background:#f8fafc; }
.upload-placeholder { display:flex; flex-direction:column; align-items:center; gap:6px; color:#94a3b8; padding:24px; text-align:center; }
.upload-placeholder svg { width:40px; height:40px; color:#cbd5e1; }
.upload-placeholder p { font-size:14px; color:#64748b; font-weight:500; }
.upload-placeholder span { font-size:12px; color:#94a3b8; }
.preview-img { width:100%; max-height:200px; object-fit:contain; display:block; }
.image-actions { display:flex; gap:8px; margin-top:8px; }
.btn-change-img { background:#eff6ff; color:#3b82f6; border:none; border-radius:6px; padding:6px 12px; font-size:13px; font-weight:600; cursor:pointer; }
.btn-remove-img { background:#fef2f2; color:#ef4444; border:none; border-radius:6px; padding:6px 12px; font-size:13px; font-weight:600; cursor:pointer; }
.form-group { margin-bottom:16px; }
.form-row { display:flex; gap:14px; }
.half { flex:1; }
.form-group label { display:block; font-size:13px; font-weight:600; color:#374151; margin-bottom:7px; }
.required { color:#ef4444; }
.form-group input, .form-group select, .form-group textarea { width:100%; border:1.5px solid #e2e8f0; border-radius:99px; padding:10px 13px; font-size:14px; font-family:inherit; color:#1e293b; transition:border-color .2s; background:#fafafa; }
.form-group textarea { border-radius: 9px; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline:none; border-color:#3b82f6; background:#fff; }
.save-error { background:#fef2f2; color:#ef4444; border:1px solid #fecaca; border-radius:8px; padding:10px 14px; font-size:13px; margin-bottom:12px; }
.form-actions { display:flex; justify-content:flex-end; gap:12px; margin-top:20px; }
.spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
@keyframes spin { to { transform:rotate(360deg); } }
.loading { display:flex; align-items:center; justify-content:center; height:120px; color:#94a3b8; }
</style>

