<template>
  <div class="ql-wrapper">
    <div class="ql-header">
      <div>
        <h3>Quản lý danh mục</h3>
        <p class="ql-sub">Tổng số: {{ categories.length }} danh mục</p>
      </div>
      <button class="btn-primary" @click="openModal(null)">+ Thêm danh mục</button>
    </div>

    <div v-if="loading" class="loading">Đang tải dữ liệu...</div>

    <div v-else-if="error" class="error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      {{ error }}
    </div>

    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên danh mục</th>
            <th>Mô tả</th>
            <th class="col-action">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.maDM">
            <td>#{{ category.maDM }}</td>
            <td class="cell-name">{{ category.tenDM }}</td>
            <td>{{ category.moTa || '—' }}</td>
            <td class="col-action">
              <button class="btn-action btn-edit" @click="openModal(category)">Sửa</button>
              <button class="btn-action btn-delete" @click="deleteCategory(category.maDM)">Xóa</button>
            </td>
          </tr>
          <tr v-if="categories.length === 0">
            <td colspan="4" class="empty-row">Chưa có danh mục nào</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Thêm/Sửa -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <h4>{{ isEdit ? 'Sửa danh mục' : 'Thêm danh mục' }}</h4>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="saveCategory" class="modal-body">
          <div class="form-group">
            <label>Tên danh mục <span class="required">*</span></label>
            <input v-model="formData.tenDM" type="text" required placeholder="Nhập tên danh mục..." />
          </div>
          <div class="form-group">
            <label>Mô tả</label>
            <textarea v-model="formData.moTa" rows="3" placeholder="Nhập mô tả (không bắt buộc)..."></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal">Hủy</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Đang lưu...' : 'Lưu lại' }}
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
  name: 'QuanLyDanhMuc',
  data() {
    return {
      categories: [],
      loading: true,
      error: null,
      isModalOpen: false,
      isEdit: false,
      saving: false,
      formData: { maDM: null, tenDM: '', moTa: '' }
    };
  },
  mounted() { this.fetchCategories(); },
  methods: {
    async fetchCategories() {
      this.loading = true;
      try {
        // API đúng: GET /api/v1/admin/category/listcategory
        const res = await api.get('/api/v1/admin/category/listcategory');
        this.categories = res.data;
      } catch (err) {
        this.error = "Không thể tải danh sách danh mục.";
      } finally {
        this.loading = false;
      }
    },
    openModal(category) {
      if (category) {
        this.isEdit = true;
        this.formData = { ...category };
      } else {
        this.isEdit = false;
        this.formData = { maDM: null, tenDM: '', moTa: '' };
      }
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
      this.formData = { maDM: null, tenDM: '', moTa: '' };
    },
    async saveCategory() {
      if (!this.formData.tenDM.trim()) return;
      this.saving = true;
      try {
        if (this.isEdit) {
          // API đúng: PUT /api/v1/admin/category/{madm}
          await api.put(`/api/v1/admin/category/${this.formData.maDM}`, {
            tenDM: this.formData.tenDM,
            moTa: this.formData.moTa
          });
        } else {
          // API đúng: POST /api/v1/admin/category/createcategory
          await api.post('/api/v1/admin/category/createcategory', {
            tenDM: this.formData.tenDM,
            moTa: this.formData.moTa
          });
        }
        await this.fetchCategories();
        this.closeModal();
      } catch (err) {
        alert("Có lỗi xảy ra khi lưu danh mục!");
      } finally {
        this.saving = false;
      }
    },
    async deleteCategory(id) {
      if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
      try {
        // API đúng: DELETE /api/v1/admin/category/{madm}
        await api.delete(`/api/v1/admin/category/${id}`);
        await this.fetchCategories();
      } catch (err) {
        alert("Xóa danh mục thất bại. Có thể danh mục đang chứa sản phẩm.");
      }
    }
  }
};
</script>

<style scoped>
.ql-wrapper { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.ql-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0; }
.ql-header h3 { color: #1e293b; font-size: 18px; font-weight: 700; }
.ql-sub { color: #64748b; font-size: 13px; margin-top: 4px; }
.btn-primary { background-color: #3b82f6; color: white; border: none; border-radius: 8px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
.btn-primary:hover { background-color: #2563eb; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-secondary { background-color: #f1f5f9; color: #475569; border: none; border-radius: 8px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-secondary:hover { background-color: #e2e8f0; }
.table-wrapper { flex: 1; overflow-y: auto; overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th { position: sticky; top: 0; background: #fff; z-index: 2; text-align: left; padding: 12px 14px; color: #64748b; font-weight: 600; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
.data-table td { padding: 14px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
.cell-name { font-weight: 600; color: #1e293b; }
.col-action { white-space: nowrap; text-align: right; }
.btn-action { border: none; border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer; margin-left: 8px; transition: all 0.15s; }
.btn-edit { background-color: #eff6ff; color: #3b82f6; } .btn-edit:hover { background-color: #dbeafe; }
.btn-delete { background-color: #fef2f2; color: #ef4444; } .btn-delete:hover { background-color: #fee2e2; }
.empty-row { text-align: center; padding: 32px !important; color: #94a3b8 !important; }
.loading, .error { display: flex; align-items: center; justify-content: center; gap: 8px; height: 120px; color: #94a3b8; }
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-box { background: #fff; border-radius: 16px; width: 100%; max-width: 450px; padding: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-header h4 { color: #1e293b; font-size: 18px; }
.modal-close { border: none; background: none; font-size: 24px; line-height: 1; color: #94a3b8; cursor: pointer; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 14px; font-weight: 500; color: #334155; margin-bottom: 8px; }
.required { color: #ef4444; }
.form-group input, .form-group textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 14px; font-family: inherit; transition: border-color 0.2s; }
.form-group input:focus, .form-group textarea:focus { outline: none; border-color: #3b82f6; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
</style>

