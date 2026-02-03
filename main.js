//HTTP request get,get/id,post,put/id, delete/id

// ============ POSTS FUNCTIONS ============

// Load và hiển thị tất cả posts (bao gồm cả posts đã xóa mềm)
async function LoadData() {
    try {
        let res = await fetch('http://localhost:3000/posts');
        let posts = await res.json();
        let body = document.getElementById("table-body");
        body.innerHTML = "";

        for (const post of posts) {
            // Thêm class 'deleted-row' nếu post bị xóa mềm
            const rowClass = post.isDeleted ? "deleted-row" : "";
            const strikeStyle = post.isDeleted ? "text-decoration: line-through;" : "";

            body.innerHTML += `<tr class="${rowClass}">
                <td style="${strikeStyle}">${post.id}</td>
                <td style="${strikeStyle}">${post.title}</td>
                <td style="${strikeStyle}">${post.views}</td>
                <td style="${strikeStyle}">${post.isDeleted ? '✓ Đã xóa' : ''}</td>
                <td>
                    ${!post.isDeleted ?
                    `<input type='button' value='Xóa mềm' onclick='SoftDelete(${post.id})' class='btn-delete'/>
                         <input type='button' value='Sửa' onclick='EditPost(${post.id})' class='btn-edit'/>`
                    :
                    `<input type='button' value='Khôi phục' onclick='RestorePost(${post.id})' class='btn-restore'/>`
                }
                    <input type='button' value='Xem Comments' onclick='ShowComments(${post.id})' class='btn-comments'/>
                </td>
            </tr>`;
        }
        return false;
    } catch (error) {
        console.log(error);
    }
}

// Lấy maxId hiện tại để tạo ID mới
async function getMaxId() {
    try {
        let res = await fetch('http://localhost:3000/posts');
        let posts = await res.json();

        if (posts.length === 0) {
            return 1;
        }

        // Tìm ID lớn nhất (chuyển sang số để so sánh)
        let maxId = Math.max(...posts.map(post => parseInt(post.id)));
        return maxId + 1;
    } catch (error) {
        console.log(error);
        return 1;
    }
}

// Lưu hoặc cập nhật post
async function Save() {
    let id = document.getElementById("id_txt").value.trim();
    let title = document.getElementById("title_txt").value;
    let views = document.getElementById("view_txt").value;

    if (!title || !views) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    // Nếu ID trống, tạo ID mới tự động
    if (!id) {
        id = String(await getMaxId());
        console.log("Tạo ID mới: " + id);
    }

    let getItem = await fetch("http://localhost:3000/posts/" + id);

    if (getItem.ok) {
        // Có item -> PUT (cập nhật)
        let existingPost = await getItem.json();
        let res = await fetch('http://localhost:3000/posts/' + id, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                views: views,
                isDeleted: existingPost.isDeleted // Giữ nguyên trạng thái xóa mềm
            })
        });

        if (res.ok) {
            console.log("Cập nhật dữ liệu thành công");
            alert("Cập nhật thành công!");
        }
    } else {
        // Không có item -> POST (tạo mới)
        let res = await fetch('http://localhost:3000/posts', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                title: title,
                views: views,
                isDeleted: false
            })
        });

        if (res.ok) {
            console.log("Thêm dữ liệu thành công");
            alert("Thêm mới thành công!");
        }
    }

    // Reset form
    ClearForm();
    LoadData();
}

// Xóa mềm post (soft delete)
async function SoftDelete(id) {
    if (!confirm("Bạn có chắc muốn xóa mềm post này?")) {
        return;
    }

    try {
        // Lấy thông tin post hiện tại
        let getRes = await fetch('http://localhost:3000/posts/' + id);
        let post = await getRes.json();

        // Cập nhật isDeleted = true
        let res = await fetch('http://localhost:3000/posts/' + id, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...post,
                isDeleted: true
            })
        });

        if (res.ok) {
            console.log("Xóa mềm thành công");
            alert("Đã xóa mềm post!");
            LoadData();
        }
    } catch (error) {
        console.log(error);
        alert("Lỗi khi xóa mềm!");
    }
}

// Khôi phục post đã xóa mềm
async function RestorePost(id) {
    try {
        // Lấy thông tin post hiện tại
        let getRes = await fetch('http://localhost:3000/posts/' + id);
        let post = await getRes.json();

        // Cập nhật isDeleted = false
        let res = await fetch('http://localhost:3000/posts/' + id, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...post,
                isDeleted: false
            })
        });

        if (res.ok) {
            console.log("Khôi phục thành công");
            alert("Đã khôi phục post!");
            LoadData();
        }
    } catch (error) {
        console.log(error);
        alert("Lỗi khi khôi phục!");
    }
}

// Chỉnh sửa post - load dữ liệu vào form
async function EditPost(id) {
    try {
        let res = await fetch('http://localhost:3000/posts/' + id);
        let post = await res.json();

        document.getElementById("id_txt").value = post.id;
        document.getElementById("title_txt").value = post.title;
        document.getElementById("view_txt").value = post.views;

        // Scroll to form
        document.getElementById("post-form").scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.log(error);
    }
}

// Clear form
function ClearForm() {
    document.getElementById("id_txt").value = "";
    document.getElementById("title_txt").value = "";
    document.getElementById("view_txt").value = "";
}

// ============ COMMENTS FUNCTIONS ============

// Hiển thị comments của một post
async function ShowComments(postId) {
    try {
        // Lấy tất cả comments của post
        let res = await fetch(`http://localhost:3000/comments?postId=${postId}`);
        let comments = await res.json();

        // Hiển thị section comments
        let commentsSection = document.getElementById("comments-section");
        commentsSection.style.display = "block";
        commentsSection.dataset.postId = postId;

        document.getElementById("current-post-id").textContent = postId;

        // Render danh sách comments
        LoadComments(postId);

        // Scroll đến comments section
        commentsSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.log(error);
    }
}

// Load danh sách comments
async function LoadComments(postId) {
    try {
        let res = await fetch(`http://localhost:3000/comments?postId=${postId}`);
        let comments = await res.json();

        let commentsList = document.getElementById("comments-list");
        commentsList.innerHTML = "";

        if (comments.length === 0) {
            commentsList.innerHTML = "<p style='color: #999;'>Chưa có comment nào.</p>";
            return;
        }

        for (const comment of comments) {
            commentsList.innerHTML += `
                <div class="comment-item">
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-actions">
                        <button onclick="EditComment('${comment.id}')" class="btn-edit-comment">Sửa</button>
                        <button onclick="DeleteComment('${comment.id}', '${postId}')" class="btn-delete-comment">Xóa</button>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.log(error);
    }
}

// Lấy maxId cho comments
async function getMaxCommentId() {
    try {
        let res = await fetch('http://localhost:3000/comments');
        let comments = await res.json();

        if (comments.length === 0) {
            return 1;
        }

        let maxId = Math.max(...comments.map(c => parseInt(c.id)));
        return maxId + 1;
    } catch (error) {
        console.log(error);
        return 1;
    }
}

// Lưu comment mới hoặc cập nhật
async function SaveComment() {
    let postId = document.getElementById("comments-section").dataset.postId;
    let commentId = document.getElementById("comment_id").value.trim();
    let commentText = document.getElementById("comment_text").value.trim();

    if (!commentText) {
        alert("Vui lòng nhập nội dung comment!");
        return;
    }

    if (!commentId) {
        // Tạo mới comment
        let newId = String(await getMaxCommentId());

        let res = await fetch('http://localhost:3000/comments', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: newId,
                text: commentText,
                postId: postId
            })
        });

        if (res.ok) {
            console.log("Thêm comment thành công");
            alert("Thêm comment thành công!");
        }
    } else {
        // Cập nhật comment
        let res = await fetch(`http://localhost:3000/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: commentId,
                text: commentText,
                postId: postId
            })
        });

        if (res.ok) {
            console.log("Cập nhật comment thành công");
            alert("Cập nhật comment thành công!");
        }
    }

    // Clear form và reload
    ClearCommentForm();
    LoadComments(postId);
}

// Edit comment - load vào form
async function EditComment(commentId) {
    try {
        let res = await fetch(`http://localhost:3000/comments/${commentId}`);
        let comment = await res.json();

        document.getElementById("comment_id").value = comment.id;
        document.getElementById("comment_text").value = comment.text;

        document.getElementById("comment_text").focus();
    } catch (error) {
        console.log(error);
    }
}

// Xóa comment (hard delete)
async function DeleteComment(commentId, postId) {
    if (!confirm("Bạn có chắc muốn xóa comment này?")) {
        return;
    }

    try {
        let res = await fetch(`http://localhost:3000/comments/${commentId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            console.log("Xóa comment thành công");
            alert("Đã xóa comment!");
            LoadComments(postId);
        }
    } catch (error) {
        console.log(error);
        alert("Lỗi khi xóa comment!");
    }
}

// Clear comment form
function ClearCommentForm() {
    document.getElementById("comment_id").value = "";
    document.getElementById("comment_text").value = "";
}

// Đóng comments section
function CloseComments() {
    document.getElementById("comments-section").style.display = "none";
    ClearCommentForm();
}

// Load dữ liệu khi trang được tải
LoadData();
