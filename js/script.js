class BookStore {
    constructor() {
        this.baseUrl = 'https://api.freeapi.app/api/v1/public/books';
        this.currentPage = 1;
        this.limit = 12;
        this.currentQuery = '';
        this.isLoading = false;
        this.totalPages = 1;

        this.initializeElements();
        this.bindEvents();
        this.loadBooks()
    }

    initializeElements() {
        this.elements = {
            mobileMenuBtn: document.getElementById("mobileMenuBtn"),
            navLinks: document.getElementById("navLinks"),
            searchInput: document.getElementById("searchInput"),
            searchBtn: document.getElementById("searchBtn"),
            booksGrid: document.getElementById("booksGrid"),
            loadingState: document.getElementById("loadingState"),
            errorState: document.getElementById("errorState"),
            emptyState: document.getElementById("emptyState"),
            pagination: document.getElementById("pagination"),
            retryBtn: document.getElementById("retryBtn"),
            booksCount: document.getElementById("booksCount")
        }
    }

    bindEvents() {
        this.elements.mobileMenuBtn.addEventListener("click", () => {
            this.elements.navLinks.classList.toggle("active")
        })

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".navbar")) {
                this.elements.navLinks.classList.remove("active")
            }
        })

        this.elements.searchBtn.addEventListener("click", () => {
            this.handleSearch();
            console.log("Clicked")
        })

        this.elements.searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this.handleSearch()
            }
        })

        this.elements.retryBtn.addEventListener("click", () => {
            this.loadBooks()
        })

        this.elements.searchInput.value = ""
    }

    handleSearch() {
        const query = this.elements.searchInput.value.trim();
        console.log(query)
        if (query) {
            this.currentQuery = query;
            this.currentPage = 1;
            this.loadBooks();
        }
    }

    showLoading() {
        this.elements.loadingState.style.display = "flex";
        this.elements.errorState.style.display = "none";
        this.elements.emptyState.style.display = "none";
        this.elements.booksGrid.innerHTML = "";
        this.elements.pagination.style.display = "none"
    }

    hideLoading() {
        this.elements.loadingState.style.display = "none";
    }

    showError(message = "Failed to load books") {
        this.hideLoading();
        this.elements.errorState.style.display = "block";
        this.elements.errorState.querySelector("p").textContent = message;
        this.elements.emptyState.style.display = "none";
        this.elements.booksGrid.innerHTML = "";
        this.elements.pagination.style.display = "none"
    }

    showEmpty() {
        this.hideLoading();
        this.elements.errorState.style.display = "none";
        this.elements.emptyState.style.display = "block";
        this.elements.booksGrid.innerHTML = "";
        this.elements.pagination.style.display = "none"
    }

    async loadBooks() {
        if (this.isLoading) return

        this.isLoading = true;
        this.showLoading();
        try {
            const url = `${this.baseUrl}?page=${this.currentPage}&limit=${this.limit}&inc=inc=kind%2Cid%2Cetag%2CvolumeInfo&query=${encodeURIComponent(this.currentQuery)}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("HTTP error! status: ", response.status);
            }

            const data = await response.json();

            if (data.success && data.data && data.data.data && Array.isArray(data.data.data)) {
                if (data.data.data.length === 0) {
                    this.showEmpty();
                } else {
                    console.log(data.data);
                    this.displayBooks(data.data.data);
                    this.updateBooksCount(data.data.data.length);
                    this.setUpPagination(data.data)
                }

            } else {
                this.showEmpty()
            }
        } catch (error) {
            console.error(`Error loading books: ${error}`)
            this.showError(error.message.includes("fetch") ? "Network error. please check your connection" : "Failed to load books")
        } finally {
            this.isLoading = false;
        }
    }

    displayBooks(books) {
        this.hideLoading();
        this.elements.errorState.style.display = "none";
        this.elements.emptyState.style.display = "none";

        this.elements.booksGrid.innerHTML = books.map(book => {
            const volumeInfo = book.volumeInfo || {};
            const title = volumeInfo?.title || "Untitled";
            const subtitile = volumeInfo?.subtitile || "";
            const authors = volumeInfo?.authors ? volumeInfo.authors.join(", ") : "Unknown Author";
            const publishedDate = volumeInfo?.publishedDate || "Unknown";
            const thumbnail = volumeInfo?.imageLinks?.thumbnail || volumeInfo?.imageLinks?.smallThumbnail || "https://via.placeholder.com/280x420/667eea/ffffff?text=No+Image";

            return `
                <a href="${book.volumeInfo.previewLink}" class="book-card" data-book-id="${book.id || ""}">
                    <div class="book-image-container">
                        <img src="${thumbnail}" class="book-image" loading="lazy" onerror="this.src='https://via.placeholder.com/280x420/667eea/ffffff?text=No+Image'">
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${this.escapeHtml(title)}</h3>
                        ${subtitile ? `<p class='book-subtitle'>${this.escapeHtml(subtitile)}</p>` : ""}
                        <p class="book-authors">${authors}</p>
                        <p class="book-published">${publishedDate}</p>
                    </div>
                </a>
            `;
        }).join("")
    }

    updateBooksCount(count){
        this.elements.booksCount.textContent = `${count} books found`
    }

    setUpPagination(data){
        this.currentPage = data.page;
        if(!data.nextPage && this.currentPage === 1){
            this.elements.pagination.style.display = "none";
            return;
        }

        const totalPage = Math.ceil((data.totalItems || 100) / this.limit);
        this.totalPages = totalPage;

        let paginationHTML = "";

        // previous button
        paginationHTML += `
            <button class="page-btn" ${this.currentPage === 1 ? "disabled" : ""} onclick="bookStore.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `

        // page numbers
        const startPage = data.page;
        const endPage = Math.min(this.totalPages, startPage + 4)

        for(let i = startPage; i <= endPage; i++){
            paginationHTML += `
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="bookStore.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // next button
        paginationHTML += `
            <button class="page-btn ${this.currentPage >= this.totalPages ? "disabled" : ""}" onclick="bookStore.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `

        this.elements.pagination.innerHTML = paginationHTML;
        this.elements.pagination.style.display = "flex"
    }

    goToPage(page){
        if(page >= 1 && page <= this.totalPages && page !== this.currentPage){
            this.currentPage = page;
            this.loadBooks();
            window.scrollTo({top: 0, behavior: "smooth"})
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

const bookStore = new BookStore();

window.bookStore = bookStore;