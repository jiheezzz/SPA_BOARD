let selectedBoardId = null;  // 선택된 게시글의 ID 저장
let filteredBoardItems = [];  // 필터링된 게시글 저장 (초기 빈 배열)
let boardItems = [];  // 전체 게시글 저장
let currentPage = 1;  // 현재 페이지 번호
const itemsPerPage = 5;  // 페이지당 게시글 수
const itemsPerPageRange = 10;  // 한 번에 보여줄 페이지 범위 (1~10, 11~20 등)
let currentPageRange = 1;      // 현재 페이지 범위 (처음은 1~10 범위)
let currentSelectedRow = null; // 현재 선택된 행을 추적하기 위한 변수
let isDetailOpen = false; // 상세보기가 열려있는지 추적하기 위한 변수






// DOM이 모두 로드된 후에 이벤트 발생
$(document).ready(async function () {
    // 전체 게시물 수 가져오기
    fetchTotalItems();
    
    // 공백 방지
    sanitizeInputFields();

    // 검색 필드 동적 변경
    toggleSearchInput();

    // 폼 초기 상태 설정
    $('#post-form').hide();
   	await loadBoards();
    restoreSearchState();
    restorePageState();

    // 검색된 상태에서 상세보기 상태를 복원
    const savedBoardId = localStorage.getItem('currentBoardId');
    const savedDetailOpen = localStorage.getItem('isDetailOpen') === 'true';
    const searchType = localStorage.getItem('searchType');
    const searchInput = localStorage.getItem('searchInput');
    if (savedDetailOpen && savedBoardId) {
        if (searchType && searchInput) {
            $('#searchType').val(searchType);
            $('#searchInput').val(searchInput);
            await searchBoards(); // 검색 실행

            // 검색 완료 후 상세보기 복원
            await toggleDetail(parseInt(savedBoardId));
        } else {
            await loadBoards();
            await toggleDetail(parseInt(savedBoardId));
        }
    }

    // 검색 필드 이벤트 리스너 설정
    attachSearchInputEvent();

    // 검색 타입 변경 시 검색 입력 필드를 재구성하고 이벤트 리스너 재설정
    $('#searchType').on('change', toggleSearchInput);
});










// 날짜형식하기
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');  
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


	







// 상태복원하기
// 검색 상태 복원
function restoreSearchState() {
    const savedSearchType = localStorage.getItem('searchType');  // 저장된 검색 타입
    const savedSearchInput = localStorage.getItem('searchInput');  // 저장된 검색어

    if (savedSearchType && savedSearchInput) {
        $('#searchType').val(savedSearchType);  // 저장된 검색 타입 설정
        toggleSearchInput();  // 저장된 검색 타입에 맞게 검색 필드를 동적으로 변경
        $('#searchInput').val(savedSearchInput);  // 저장된 검색어 복원
        searchBoards();  // 검색 조건을 복원하여 검색 실행
    }
}
// 페이징 상태 복원
function restorePageState() {
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) {
        currentPage = Number(savedPage);
        goToPage(currentPage);  
    } else {
        goToPage(1);
    }
}










// 상태저장하기
// 검색 상태 저장 함수
function saveSearchState(searchType, searchInput) {
    localStorage.setItem('searchType', searchType);
    localStorage.setItem('searchInput', searchInput);
}
// 페이지 상태 저장 함수
function savePageState(currentPage) {
    localStorage.setItem('currentPage', currentPage);
}










// 상태초기화하기
// 검색 상태 초기화 함수
function clearSearch() {
    const searchType = document.getElementById('searchType').value;

    // 검색어 입력 필드를 초기화
    if (searchType === 'title') {
        // 타이틀 검색일 경우, 셀렉트 박스를 초기화
		document.getElementById('searchInput').selectedIndex = 0;  // 첫 번째 옵션 선택
    } else if (searchType === 'name') {
        // 네임 검색일 경우, 텍스트 입력 필드를 초기화
        document.getElementById('searchInput').value = '';  // 입력 필드 초기화
    }

    filteredBoardItems = [];  // 검색된 게시물 초기화
}
// 검색 상태 초기화 함수
function clearPage() {
    localStorage.removeItem('currentPage');
}










// 토탈카운트하기
// 총 페이지 수를 계산하는 함수
function calculateTotalPages(totalItems) {
    const items = totalItems > 0 ? filteredBoardItems : boardItems;
    totalPages = Math.ceil(items.length / itemsPerPage);
    return totalPages;
}
// 전체 게시글 수를 가져오는 함수
function fetchTotalItems() {
    $.ajax({
        url: '/api/board/total-count',
        method: 'GET',
        success: function (data) {
            // 응답 데이터를 처리할 수 있는 로직을 추가하세요 (필요한 경우)
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Network response was not ok: ' + textStatus);
        }
    });
}
// 필터링 된 게시물 수 가져오는 함수
function getTotalItemsBasedOnSearch() {
    // 검색된 결과가 있는 경우, 필터링된 게시물의 개수를 반환
    if (filteredBoardItems && filteredBoardItems.length > 0) {
        return filteredBoardItems.length;
    }
    // 검색된 결과가 없거나 모든 게시물을 불러올 때는 전체 게시물 수를 반환
    return totalItems;
}
// 총 게시물 수를 표시하는 함수
function updateTotalItemsCount(count) {
    $('#total-items').text(`총 게시물 수: ${count}`);
}










// 리스트하기
// 리스트 형태
function displayPage(page) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    // 최신순으로 정렬
    filteredBoardItems.sort((a, b) => {
        const dateA = a.modifiedDate ? new Date(a.modifiedDate) : new Date(a.regdate);
        const dateB = b.modifiedDate ? new Date(b.modifiedDate) : new Date(b.regdate);
        return dateB - dateA;
    });

    // 검색된 데이터를 기준으로 페이징
    const pageItems = filteredBoardItems.slice(start, end);


        const boardList = $('#board-list');
        boardList.empty();  // 기존 게시글 목록 초기화

        const totalBoardCount = filteredBoardItems.length;  // 검색된 게시물 수
        let currentIdx = totalBoardCount - start;  // 가장 최신글이 1번

        // 페이지 아이템 목록 구성
        $.each(pageItems, function(index, board) {
            let formattedDate = formatDate(board.modifiedDate || board.regdate);  // 수정일 또는 작성일
            const lockIcon = board.secret ? '🔒' : '';  // 비밀글이면 자물쇠 아이콘 표시

            let boardItem = `
                <tr id="board-row-${board.idx}">
                    <td>${currentIdx--}</td>  <!-- 역순으로 번호 부여 -->
                    <td>${lockIcon} ${board.title}</td>
                    <td>${board.name}</td>
                    <td>${formattedDate}</td>
                    <td id="cnt-${board.idx}">${board.cnt}</td>
                    <td>
                        <button onclick="toggleDetail(${board.idx})">상세</button>
                    </td>
                </tr>
            `;
            boardList.append(boardItem);
        });

}
// 게시글을 로드하는 함수
async function loadBoards() {
   return new Promise((resolve, reject) => {
		 $.ajax({
		    url: '/api/board',
		    method: 'GET',
		    success: function(boards) {
				
		        boardItems = boards;
		        filteredBoardItems = [...boardItems];
		        totalItems = filteredBoardItems.length;
		        totalPages = calculateTotalPages();  // 전체 페이지 수 계산
		        displayPage(currentPage);           // 현재 페이지 출력
		        displayPageNumbers();               // 페이지 번호 출력
		        updateTotalItemsCount(totalItems);
		        $('#next-page-button, #last-page-button').show();  // jQuery로 버튼 표시
				
				resolve();	
		    },
		    error: function(jqXHR, textStatus, errorThrown) {
		        console.error('게시글 로드 실패:', textStatus, errorThrown);
				reject();
		    }
		});
	});
}










// 검색하기
// 검색 필드를 카테고리와 작성자 ID에 따라 동적으로 변경
function toggleSearchInput() {
    const searchType = $('#searchType').val();
    const searchInputContainer = $('#searchInputContainer');

    // 타이틀 검색일 경우 셀렉트 박스
    if (searchType === 'title') {
        // HTML 내부의 숨겨진 `predefinedTitles`를 활용하여 옵션 가져오기
        let selectHtml = `<select id="searchInput">`;
        $('#predefinedTitles option').each(function() {
            const title = $(this).val();
            const selected = (title === '검색어를 선택하세요.') ? 'selected' : '';  // '검색어를 선택하세요.' 선택
            selectHtml += `<option value="${title}" ${selected}>${title}</option>`;
        });
        selectHtml += `</select>`;
        searchInputContainer.html(selectHtml);
    } 
    // 네임 검색일 경우 텍스트 입력 필드
    else if (searchType === 'name') {
        searchInputContainer.html(`<input type="text" id="searchInput" placeholder="작성자 ID를 입력하세요">`);
    }

    attachSearchInputEvent();

    // 현재 검색 타입을 저장하여 이후 비교
    localStorage.setItem('previousSearchType', searchType);
}


function attachSearchInputEvent() {
    const searchInput = $('#searchInput');
    if (searchInput.length) {
        // 기존에 추가된 이벤트 리스너 제거 (중복 방지)
        searchInput.off('keydown', handleSearchInputKeyDown);

        // 새로운 이벤트 리스너 추가
        searchInput.on('keydown', handleSearchInputKeyDown);
    }
}

function handleSearchInputKeyDown(event) {
    if (event.key === 'Enter') {
        onSearchButtonClick();
        event.preventDefault(); // 기본 Enter 키 동작 방지
    }
}

function onSearchButtonClick() {
    currentPage = 1;
    isSearchButtonClicked = true; // 검색 버튼이 눌렸음을 기록
    searchBoards(); // 검색 실행
}


let isSearchButtonClicked = false;  // 검색 버튼 클릭 여부를 추적

async function searchBoards() {
    const searchType = $('#searchType').val();
    let searchInput = $('#searchInput').val().trim();
    console.log(searchType + "/" + searchInput);

    // 카테고리 검색 시 기본 선택 값 "검색어를 선택하세요."가 선택된 경우 모든 게시물 불러오기
    if (searchType === 'title' && (searchInput === '' || searchInput === '검색어를 선택하세요.')) {
        localStorage.removeItem('searchType');
        localStorage.removeItem('searchInput');
        localStorage.removeItem('currentPage');
        toggleDetail3();
        loadBoards();
        goToPage(1);
        return;
    }

    // 검색 상태 저장
    saveSearchState(searchType, searchInput);

    // 기존 리스트 초기화
    const $boardList = $('#board-list');
    $boardList.empty(); // 기존 리스트 초기화

    // 캐시 방지를 위해 타임스탬프 추가
    const timestamp = new Date().getTime();
	
	return new Promise((resolve, reject) => {
    // 검색 API 요청
    $.ajax({
        url: '/api/board/search',
        method: 'GET',
        data: {
            searchType: searchType,
            searchInput: searchInput,
            ts: timestamp
        },
        success: function (boards) {
            // 최신순으로 정렬
            filteredBoardItems = boards.sort((a, b) => {
                const dateA = a.modifiedDate ? new Date(a.modifiedDate) : new Date(a.regdate);
                const dateB = b.modifiedDate ? new Date(b.modifiedDate) : new Date(b.regdate);
                return dateB - dateA;
            });

            const totalItems = filteredBoardItems.length; // 총 게시물 수 저장

            if (totalItems === 0) {
                $boardList.html(`
                    <tr>
                        <td colspan="7">게시물이 없습니다</td>
                    </tr>
                `);
                $('#pagination').hide();
            } else {
                const totalPages = updateTotalItemsCount(totalItems);
                displayPageNumbers(); // 페이지 번호 표시
                $('#pagination').show();

                // 페이지 처리 로직은 그대로 유지
                if (totalPages <= 10) {
                    if (currentPage === totalPages) {
                        $('#first-page-button, #prev-page-button, #next-page-button, #last-page-button').hide();
                    }
                } else {
                    const nextRangeStart = Math.floor((currentPage - 1) / itemsPerPageRange) * itemsPerPageRange + itemsPerPageRange + 1;

                    if (currentPage === totalPages || nextRangeStart > totalPages) {
                        $('#next-page-button, #last-page-button').hide();
                    } else {
                        $('#next-page-button, #last-page-button').show();
                    }
                }

                if (currentPage === 1) {
                    $('#first-page-button').hide();
                    $('#next-page-button, #last-page-button').show();
                }
            }
			
			console.log("search")

            toggleDetail3();
            // 페이지 갱신
            goToPage(currentPage);
			resolve();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('검색 요청 실패:', textStatus, errorThrown);
			reject();
        }
    });
	});
}











//페이징하기
// 페이지 번호를 출력하는 함수
function displayPageNumbers() {
    const $pageNumbersContainer = $('#page-numbers');
    $pageNumbersContainer.empty(); // 기존 번호 초기화

    const totalPages = calculateTotalPages(totalItems);
    const startPage = (currentPageRange - 1) * itemsPerPageRange + 1; // 페이지 번호 범위 시작
    const endPage = Math.min(startPage + itemsPerPageRange - 1, totalPages); // 페이지 번호 범위 끝

    for (let i = startPage; i <= endPage; i++) {
        const $pageNumber = $('<button>')
            .text(i)
            .on('click', function () {
                if (i !== currentPage) {
                    goToPage(i); // 현재 페이지가 아닐 때만 페이지 이동
                }
            });

        if (i === currentPage) {
            // 현재 페이지 버튼 비활성화 및 스타일 적용
            $pageNumber.attr('disabled', true).css({
                'font-weight': 'bold',
                'border-color': 'gray',
                'cursor': 'default',
                'background-color': '#ddd'
            });
        } else {
            // 다른 페이지 버튼은 클릭 가능
            $pageNumber.css({
                'font-weight': 'normal',
                'border-color': 'blue',
                'cursor': 'pointer'
            });
        }

        $pageNumbersContainer.append($pageNumber);
    }
}
function goToPage(page) {
    currentPage = page;
    const totalItems = getTotalItemsBasedOnSearch(); // 검색 결과에 따라 전체 아이템 수를 가져오는 함수

    currentPageRange = Math.ceil(currentPage / itemsPerPageRange);

    displayPage(currentPage); // 현재 페이지 게시글 표시
    displayPageNumbers(); // 페이지 번호 범위 표시

    const totalPages = calculateTotalPages(totalItems); // 전체 페이지 수 계산

    // 페이지 상태를 localStorage에 저장
    savePageState(currentPage);

    // 수정 폼 숨기기
    $('#edit-form').hide();

    // 이전, 다음 버튼 제어
    $('#first-page-button').toggle(currentPage >= 11);
    $('#prev-page-button').toggle(currentPageRange > 1);

    if (totalPages <= 10) {
        // 전체 페이지가 10개 이하인 경우
        const hideAllNavButtons = currentPage === totalPages;
        $('#first-page-button, #prev-page-button, #next-page-button, #last-page-button').toggle(!hideAllNavButtons);
    } else {
        // 전체 페이지가 10개를 초과한 경우
        const nextRangeStart = Math.floor((currentPage - 1) / itemsPerPageRange) * itemsPerPageRange + itemsPerPageRange + 1;
        $('#next-page-button, #last-page-button').toggle(currentPage !== totalPages && nextRangeStart <= totalPages);
    }

    // 첫 번째 페이지일 때, 첫 페이지 버튼을 숨김 처리
    $('#first-page-button').toggle(currentPage !== 1);
}

// 이전 페이지 범위로 이동하는 함수 (범위 끝 페이지로 이동)
function prevPageRange() {
    if (currentPageRange > 1) {
        currentPageRange--;  // 이전 범위로 이동
        currentPage = (currentPageRange - 1) * itemsPerPageRange + itemsPerPageRange;  // 범위 끝 페이지로 이동
        goToPage(currentPage);
    }
}

// 다음 페이지 범위로 이동하는 함수 (범위 시작 페이지로 이동)
function nextPageRange() {
    const maxPageRange = Math.ceil(totalPages / itemsPerPageRange);

    if (currentPageRange < maxPageRange) {
        currentPageRange++;  // 다음 범위로 이동
        currentPage = (currentPageRange - 1) * itemsPerPageRange + 1;  // 범위 시작 페이지로 이동
        goToPage(currentPage);
    }
}

// 첫 페이지로 이동하는 함수
function firstPage() {
    goToPage(1);
}

// 마지막 페이지로 이동하는 함수
function lastPage() {
    goToPage(totalPages);  // 마지막 페이지로 이동

    // 다음과 마지막 버튼 숨기기
    $('#next-page-button, #last-page-button').hide();
    
    // 처음과 이전 버튼 보이기
    $('#first-page-button, #prev-page-button').show();
}









// 토글하기
// 게시글 작성 폼 열기 및 닫기
function togglePostForm() {
    const $postForm = $('#post-form');
    const $toggleButton = $('button[onclick="togglePostForm()"]'); 

    if ($postForm.css('display') === 'none') {
        $postForm.show();  // 폼을 표시
        $toggleButton.text('닫기');   // 버튼 글씨를 '닫기'로 변경
    } else {
        $postForm.hide();  // 폼을 숨김
        $toggleButton.text('새글쓰기'); // 버튼 글씨를 '새글쓰기'로 변경
        $('#file, #etc').val(''); // 입력 필드 초기화
    }
}

//수정 폼 열기 닫기
function toggleEditForm() {
    const $editForm = $('#edit-form');
    const $detailSection = $('#detail-content');
    
    if ($editForm.css('display') === 'none') {
        $editForm.show();
        $detailSection.hide();
    } else {
        $editForm.hide();
    }
}
// 상세보기 닫기
function toggleDetail3() {
    const detailSection = document.getElementById('detail-content');
    const editForm = document.getElementById('edit-form');
    const postForm = document.getElementById('post-form');

    detailSection.style.display = 'none';
    editForm.style.display = 'none';
    postForm.style.display = 'none';
    isDetailOpen = false;

    // 현재 선택된 행의 색상을 원래대로 되돌리기
    if (currentSelectedRow) {
        currentSelectedRow.classList.remove('selected');
        currentSelectedRow = null;
        localStorage.removeItem('currentSelectedRowId');
    }
    // 상세보기 상태 저장 해제
    localStorage.removeItem('currentBoardId');
    localStorage.setItem('isDetailOpen', 'false');
}

// 수정 폼 닫기
function toggleDetail2() {
    const detailSection = document.getElementById('detail-content');
    const editForm = document.getElementById('edit-form');  

    detailSection.style.display = 'block';
    editForm.style.display = 'none';  
    isDetailOpen = false;
}








// 상세하기
//상세보기 폼 열기
async function toggleDetail(idx) {
    // 이미 열려 있는 상세 보기인지 확인
    if (isDetailOpen && currentBoardId === idx) {
        return; // 현재 열려있는 게시글을 다시 클릭하면 아무 동작도 하지 않음
    }

    // 이전에 선택된 행의 색상 제거 및 상태 초기화
    if (currentSelectedRow) {
        $(currentSelectedRow).removeClass('selected');
    }

    const $detailSection = $('#detail-content');
    currentBoardId = idx;

    // 현재 열려있는 상세보기를 닫기
    if (isDetailOpen && currentBoardId !== idx) {
        toggleDetail3(); // 기존 열려있던 상세보기를 닫기 위한 함수 호출
    }
	
	return new Promise((resolve, reject) => {
	    $.ajax({
		    url: '/api/board/checkAdmin',
		    method: 'GET',
		    async: true,
		    xhrFields: { withCredentials: true },
		    success: function(userData) {
	
		        const currentUserName = userData.username;
		        const isAdmin = userData.isAdmin;
	
		        $.ajax({
		            url: `/api/board/${idx}/detail/re`,
		            method: 'POST',
		            xhrFields: { withCredentials: true },
		            async: true,
		            headers: {
		                'Content-Type': 'application/x-www-form-urlencoded'
		            },
		            success: function(boardData) {
		                const boardAuthorName = boardData.name;
		                const isSecret = boardData.isSecret;
					
		                // 비밀글 접근 권한 확인
		                if (isSecret && currentUserName !== boardAuthorName && !isAdmin) {
		                    alert('비밀글입니다.');
		                    toggleDetail3();
		                    return;
		                }

		                // 현재 선택된 행의 색상 변경
		                const $selectedRow = $(`#board-row-${idx}`);
		                if ($selectedRow.length) {
		                    $selectedRow.addClass('selected');
		                    currentSelectedRow = $selectedRow[0];
		                } else {
		                    console.warn(`Element not found for board-row-${idx}`);
		                }

		                // 선택된 행의 ID를 LocalStorage에 저장
		                localStorage.setItem('currentSelectedRowId', `board-row-${idx}`);
		                localStorage.setItem('currentBoardId', idx);
		                localStorage.setItem('isDetailOpen', 'true');

		                // 상세 정보 표시
		                $detailSection.show();
		                loadBoard(idx); // 게시글 세부 정보 로드
		                loadComments(currentBoardId); // 댓글 정보 로드
		                isDetailOpen = true; // 상세보기 열림 상태로 설정

		                const $editButton = $('#edit-btn');
		                const $deleteButton = $('#delete-btn');

		                // 작성자와 로그인한 사용자가 같으면 수정 버튼 보이기
		                if (currentUserName === boardAuthorName) {
		                    $editButton.show();
		                } else {
		                    $editButton.hide();
		                }

		                // 작성자 또는 관리자일 경우 삭제 버튼 보이기
		                if (currentUserName === boardAuthorName || isAdmin) {
		                    $deleteButton.show();
		                    $deleteButton.attr('onclick', `deleteBoard(${currentBoardId})`);
		                } else {
		                    $deleteButton.hide();
		                }
						resolve();
		            },
		            error: function(jqXHR, textStatus, errorThrown) {
		                console.error('Failed to fetch board details:', textStatus, errorThrown);
						reject();
		            }
		        });
		    },
		    error: function(jqXHR, textStatus, errorThrown) {
		        console.error('Failed to fetch user info:', textStatus, errorThrown);
		    }
		});
	});
}


// 상세보기 조회수
function loadBoard(idx) {
	// 로그인한 사용자 정보를 가져오기
	$.ajax({
	    url: '/api/board/user-info',
	    method: 'GET',
	    xhrFields: { withCredentials: true },
	    success: function(userData) {
	        const currentUserName = userData.id;  // 로그인한 사용자 ID
	        const viewedKey = `viewed_${idx}_${currentUserName}`;  // 사용자별로 키 생성

	        // 로컬 스토리지에서 조회 기록 확인
	        const viewedData = localStorage.getItem(viewedKey);
	        const viewed = viewedData ? JSON.parse(viewedData) : null;

	        // 현재 시간
	        const now = new Date().getTime();

	        // 게시글 상세 정보를 가져오기 (작성자 확인을 위해)
	        $.ajax({
	            url: `/api/board/${idx}/detail/re`,
	            method: 'POST',
	            xhrFields: { withCredentials: true },
	            headers: {
	                'Content-Type': 'application/x-www-form-urlencoded'
	            },
	            success: function(boardData) {
	                const boardAuthorName = boardData.name;  // 게시글 작성자 이름
	                const oneDayInMs = 24 * 60 * 60 * 1000;  // 24시간(밀리초)

	                // 로그인한 사용자와 게시글 작성자가 다르고, 조회 기록이 없거나 24시간이 지난 경우
	                if (currentUserName !== boardAuthorName && (!viewed || (now - viewed.timestamp > oneDayInMs))) {
	                    // 조회수 증가 요청
	                    $.ajax({
	                        url: `/api/board/${idx}/increase-view`,
	                        method: 'POST',
	                        success: function(updatedBoard) {
	                            updateBoardDetails(updatedBoard, idx);  // 게시글 업데이트
	                            // 조회 기록과 현재 시간을 로컬 스토리지에 저장
	                            const viewedData = JSON.stringify({ viewed: true, timestamp: now });
	                            localStorage.setItem(viewedKey, viewedData);
								if(isDetailOpen=false){
	                            	loadBoards();
	                        	}
							}
	                    });
	                } else {
	                    // 조회수 증가 없이 게시글 로딩
	                    $.ajax({
	                        url: `/api/board/${idx}/no-view`,
	                        method: 'GET',
	                        success: function(board) {
	                            updateBoardDetails(board, idx);  // 게시글 업데이트
	                        }
	                    });
	                }
	            },
	            error: function(jqXHR, textStatus, errorThrown) {
	                console.error('Failed to fetch board details:', textStatus, errorThrown);
	            }
	        });
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
	        console.error('Failed to fetch user info:', textStatus, errorThrown);
	    }
	});
}
//상세보기 내용 업데이트
function updateBoardDetails(board, idx) {
    // 게시글 상세보기 내용 업데이트
    $('#detail-title').text(board.title);
    $('#detail-idx').text(idx);
    $('#detail-email').text(board.email);
    $('#detail-etc').text(board.etc);
    $('#detail-name').text(board.name);
    $('#detail-cnt').text(board.cnt);

    // 사진 표시
    if (board.photo) {
        $('#detail-photo').attr('src', `/uploads/${board.photo}`).show();

        let fileNameParts = board.photo.split('_');
        let displayedFileName = fileNameParts[fileNameParts.length - 1];
        $('#current-photo-name').text(displayedFileName);
    } else {
        $('#detail-photo').hide();
        $('#current-photo-name').text('첨부된 파일 없음');
    }

    // 수정된 게시글인 경우 수정일 표시, 수정되지 않은 경우 작성일 표시
    if (board.modifiedDate) {
        $('#detail-modified').show();
        $('#detail-day').hide();
        $('#detail-modified-date').text(` ${formatDate(board.modifiedDate)}`);
    } else {
        $('#detail-modified').hide();
        $('#detail-day').show();
        $('#detail-day').text(`작성일: ${formatDate(board.regdate)}`);  // 작성일 표시
    }

    // 수정 폼에 게시글 정보 설정
    $('#edit-idx').text(board.idx);
    $('#edit-title').val(board.title);
    $('#edit-name').val(board.name);
    $('#edit-etc').val(board.etc);
    $('#edit-is-secret').prop('checked', board.secret);

    const $cntElement = $(`#cnt-${idx}`);
    if ($cntElement.length) {
        $cntElement.text(board.cnt);  // 조회수 업데이트
    }
}









// 수정하기
function submitEdit() {
    const idx = $('#detail-idx').text();
    const title = $('#edit-title').val();
    const etc = $('#edit-etc').val();
    const name = $('#edit-name').val();
    const isSecret = $('#edit-is-secret').prop('checked');
    const photo = $('#edit-photo')[0].files[0]; // 파일 선택

    const formData = new FormData();
    formData.append('idx', idx);
    formData.append('title', title);
    formData.append('etc', etc);
    formData.append('name', name);
    formData.append('isSecret', isSecret);

    // 파일이 있으면 검증
    if (photo) {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validImageTypes.includes(photo.type)) {
            alert('이미지 파일만 업로드 가능합니다.');
            return; // 검증 실패 시 함수 종료
        }
        formData.append('photo', photo); // 검증된 파일만 추가
    }

    $.ajax({
        url: '/api/board/update',
        method: 'POST',
        data: formData,
        processData: false, // FormData 사용 시 필수
        contentType: false, // FormData 사용 시 필수
        success: function() {
            alert('수정 완료');
            $('#edit-form, #detail-content, #post-form').hide();
            loadBoards(); // 게시글 목록 새로고침
            firstPage(1);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('수정 실패:', textStatus, errorThrown);
            alert('수정 실패');
        }
    });
}









// 게시글 삭제하기
function deleteBoard() {
    if (confirm('정말로 삭제하시겠습니까?')) {
        $.ajax({
            url: `/api/board/${currentBoardId}`,
            method: 'DELETE',
            contentType: 'application/json',
            success: function() {
                alert('게시글이 삭제되었습니다.');
                $('#detail-content').hide(); // 상세보기 접기
                localStorage.removeItem('currentBoardId');
                localStorage.removeItem('isDetailOpen');
                loadBoards(); // 게시글 목록 새로고침
                firstPage(1);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error(`Failed to delete board: ${textStatus}`, errorThrown);
                alert(`Failed to delete board: ${jqXHR.responseText}`);
            }
        });
    }
}









//벨리데이션하기
// 글자 수를 체크하고 표시하는 함수 (게시글 내용)
function validateLength() {
    const textArea = $('#etc');
    const charCount = textArea.val().length;
    const maxChars = 255;

    // 글자 수 제한
    if (charCount > maxChars) {
        textArea.val(textArea.val().substring(0, maxChars));
    }

    // 글자 수 표시 업데이트
    $('#char-count').text(`${textArea.val().length}/${maxChars} 글자`);
}
// 글자 수를 체크하고 표시하는 함수 (댓글 내용)
function validateCommentLength() {
    const commentInput = $('#comment-input');
    const charCount = commentInput.val().length;
    const maxChars = 255;

    // 글자 수 제한
    if (charCount > maxChars) {
        commentInput.val(commentInput.val().substring(0, maxChars));
    }

    // 글자 수 표시 업데이트
    $('#comment-char-count').text(`${commentInput.val().length}/${maxChars} 글자`);
}
// 이미지 파일 크기 제한
function validateImage() {
    const $fileInput = $('#file');
    const file = $fileInput[0].files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB를 바이트로 변환

    if (file && file.size > maxSize) {
        alert("파일 크기가 5MB를 초과하였습니다. 다른 파일을 선택해주세요.");
        $fileInput.val(''); // 파일 입력 초기화
    }
    
    if (file) {
        const fileType = file.type;
        if (!fileType.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            $fileInput.val(''); // 파일 입력값 초기화
        }
    }
}
// HTML 특수 문자 이스케이프
function escapeHTML(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}
// 입력 필드의 공백 및 XSS 방지 처리
function sanitizeInputFields() {
    $('input').each(function() {
        // 공백을 입력하려고 하면 차단
        $(this).on('keydown', function(event) {
            if (event.key === ' ' || event.keyCode === 32) {
                event.preventDefault(); // 공백 입력을 차단
            }
        });

        // 입력 중 XSS 방지 처리
        $(this).on('input', function() {
            $(this).val(escapeHTML($(this).val()));
        });
    });
}







//제출하기
// 게시글 작성 폼 제출 처리
$('#post-form').on('submit', function(event) {
    event.preventDefault();
    submitBoard(); // 저장
});
// 댓글 폼 제출 처리
$('#comment-form').on('submit', function() {
    return validateLength();
});
// 수정 폼 제출 처리
$('#edit-form').on('submit', function() {
    return validateLength();
});












	
//글 저장하기
function submitBoard() {
    const formData = new FormData();
    
    // 폼 데이터를 추가
    const inquiryType = $('#inquiry-type').val();
    const content = $('#etc').val();
    const isSecret = $('#is-secret').prop('checked');
    const toggleButton = $('button[onclick="togglePostForm()"]');

    // 유효성 검사
    if ($.trim(content) === '') {
        alert('내용을 입력하세요.');
        $('#etc').focus();
        return false;
    }

    formData.append('inquiryType', inquiryType);
    formData.append('etc', content);
    formData.append('isSecret', isSecret);

    // 파일 첨부 (선택)
    const fileInput = $('#file')[0];
    if (fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
    }

    // AJAX 요청
    $.ajax({
        url: '/api/board',
        method: 'POST',
        data: formData,
        processData: false, // FormData를 사용하기 때문에 false로 설정
        contentType: false, // FormData를 사용하기 때문에 false로 설정
        xhrFields: { withCredentials: true },
        success: function() {
            alert('게시글이 성공적으로 작성되었습니다.');
            
            // 폼 리셋
            $('#post-form')[0].reset();
            localStorage.removeItem('searchType');
            localStorage.removeItem('searchInput');
            localStorage.removeItem('currentPage');
            $('#searchInput').prop('selectedIndex', 0);

            loadBoards(); // 게시글 목록 새로고침
            $('#post-form, #detail-content').hide();
            firstPage(1);
            toggleButton.text('새글쓰기');
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('게시글 작성 실패:', textStatus, errorThrown);
            alert('게시글 작성 실패');
        }
    });

    return false; // 폼을 실제로 제출하지 않음
}








		
//댓글하기
// 댓글 불러오기
function loadComments(boardId) {
    // 현재 사용자의 역할(관리자인지 여부)을 먼저 가져오기
    $.ajax({
        url: '/api/board/user-role',
        method: 'GET',
        xhrFields: { withCredentials: true },
        success: function(userData) {
            const isAdmin = userData.isAdmin;  // 'ROLE_ADMIN'이 관리자 역할

            // 관리자인 경우에만 댓글 입력 폼 표시
            if (isAdmin) {
                $('#comment-form').show(); // 댓글 폼 표시
            } else {
                $('#comment-form').hide(); // 일반 사용자에게는 숨기기
            }

            // 댓글 목록을 로드
            $.get(`/api/comments/board/${boardId}`, function(comments) {
                const commentList = $('#comment-list');
                commentList.empty(); // 기존 댓글을 초기화

                comments.forEach(function(comment) {
                    let formattedDate = formatDate(comment.createdDate);

                    // 관리자일 경우에만 삭제 버튼을 표시
                    const deleteButton = isAdmin
                        ? `<button class="delete-btn" onclick="deleteComment(${comment.id})">삭제</button>`
                        : '';  // 관리자가 아니면 빈 문자열

                    // Comment HTML 구조
                    const commentHtml = `
                        <div class="comment" id="comment-${comment.id}">
                            <div class="comment-content">
                                <p>${comment.content}</p>
                                <span class="comment-date">${formattedDate}</span>
                            </div>
                            <div class="comment-actions">
                                ${deleteButton}
                            </div>
                        </div>
                    `;
                    commentList.append(commentHtml);
                });
            });
        },
        error: function() {
            console.error("Failed to check user's role");
        }
    });
}
// 댓글 추가 시 글자 수 제한을 확인하는 함수
function addComment() {
    const commentInput = $('#comment-input');
    const commentText = commentInput.val().trim();
    const boardId = currentBoardId; // Ensure currentBoardId is set when loading the post

    // 댓글 길이 제한 확인
    if (commentText === '') {
        alert('댓글을 입력하세요.');
        return;
    }

    if (commentText.length > 255) {
        alert('댓글은 255자 이내로 입력해주세요.');
        return;
    }

    const commentData = {
        content: commentText,
        board: { id: boardId }
    };

    // 댓글 추가 요청
    $.ajax({
        url: `/api/comments/board/${boardId}/add`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(commentData),
        success: function(savedComment) {
            let formattedDate = formatDate(savedComment.createdDate);
            const commentList = $('#comment-list');
            const commentHtml = `
                <div class="comment" id="comment-${savedComment.id}">
                    <div class="comment-content">
                        <p>${savedComment.content}</p>
                        <span class="comment-date">${formattedDate}</span>
                    </div>
                    <div class="comment-actions">
                        <button class="delete-btn" onclick="deleteComment(${savedComment.id})">삭제</button>
                    </div>
                </div>
            `;
            commentList.append(commentHtml);
            commentInput.val(''); // Clear input field
            validateCommentLength(); // Clear and update the character count
        }
    });
}
// 댓글 입력 필드에 이벤트 리스너 추가
$('#comment-input').on('input', validateCommentLength);
// 댓글 삭제
function deleteComment(commentId) {
    if (confirm("댓글을 삭제하시겠습니까?")) {
        $.ajax({
            url: `/api/comments/${commentId}/delete`,
            method: 'DELETE',
            contentType: 'application/json',
            success: function() {
                // 댓글 삭제가 성공하면, DOM에서 해당 댓글을 제거
                $(`#comment-${commentId}`).remove();
            },
            error: function(response) {
                alert(`댓글 삭제 실패: ${response.responseText}`);
            }
        });
    }
}










//홈으로하기
$('#reset-btn').on('click', () => {
    // localStorage에서 모든 항목 제거
    localStorage.removeItem('searchType');
    localStorage.removeItem('searchInput');
    localStorage.removeItem('currentPage');
    localStorage.removeItem('currentBoardId');
    localStorage.removeItem('isDetailOpen');
    
    toggleDetail3();
    resetFrontendState();
    window.location.href = "/main";
});

function resetFrontendState() {
    // 상세 내용, 작성 폼, 수정 폼을 숨김 처리
    $('#detail-content').hide();
    $('#post-form').hide();
    $('#edit-form').hide();
}
