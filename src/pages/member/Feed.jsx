import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function Feed() {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newPost, setNewPost] = useState({ content: '', image: null, visibility: 'public' });
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState('');
	const [showCommentsModal, setShowCommentsModal] = useState(false);
	const [selectedPost, setSelectedPost] = useState(null);
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState('');
	const [replyingTo, setReplyingTo] = useState(null);
	const [replyText, setReplyText] = useState('');
	const [showShareModal, setShowShareModal] = useState(false);
	const [shareMessage, setShareMessage] = useState('');
	const [sharing, setSharing] = useState(false);

	useEffect(() => {
		loadFeed();
	}, []);

	async function loadFeed() {
		try {
			setLoading(true);
			const { data } = await api.get('/member/feed');
			setPosts(data.data || []);
		} catch (error) {
			console.error('Failed to load feed:', error);
		} finally {
			setLoading(false);
		}
	}

	async function createPost(e) {
		e.preventDefault();
		setSubmitting(true);
		
		try {
			const formData = new FormData();
			formData.append('content', newPost.content);
			formData.append('visibility', newPost.visibility);
			if (newPost.image) {
				formData.append('image', newPost.image);
			}

			await api.post('/member/posts', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});

			setMessage('Post created successfully!');
			setNewPost({ content: '', image: null, visibility: 'public' });
			setShowCreateModal(false);
			await loadFeed();
			setTimeout(() => setMessage(''), 3000);
		} catch (error) {
			setMessage('Failed to create post');
			setTimeout(() => setMessage(''), 3000);
		} finally {
			setSubmitting(false);
		}
	}

	async function likePost(postId) {
		try {
			const { data } = await api.post(`/member/posts/${postId}/like`);
			
			// Update the post in the state
			setPosts(posts.map(post => 
				post.id === postId 
					? { ...post, likes_count: data.likes_count, is_liked: data.is_liked }
					: post
			));
		} catch (error) {
			console.error('Failed to like post:', error);
		}
	}

	async function deletePost(postId) {
		if (!confirm('Are you sure you want to delete this post?')) return;
		
		try {
			await api.delete(`/member/posts/${postId}`);
			setMessage('Post deleted successfully!');
			await loadFeed();
			setTimeout(() => setMessage(''), 3000);
		} catch (error) {
			setMessage('Failed to delete post');
			setTimeout(() => setMessage(''), 3000);
		}
	}

	async function openCommentsModal(post) {
		setSelectedPost(post);
		setShowCommentsModal(true);
		await loadComments(post.id);
	}

	async function loadComments(postId) {
		try {
			const { data } = await api.get(`/member/posts/${postId}/comments`);
			setComments(data);
		} catch (error) {
			console.error('Failed to load comments:', error);
		}
	}

	async function addComment(e) {
		e.preventDefault();
		if (!newComment.trim()) return;

		try {
			await api.post(`/member/posts/${selectedPost.id}/comments`, {
				content: newComment.trim()
			});
			setNewComment('');
			await loadComments(selectedPost.id);
			await loadFeed(); // Update post comment count
		} catch (error) {
			console.error('Failed to add comment:', error);
		}
	}

	async function addReply(e, parentCommentId) {
		e.preventDefault();
		if (!replyText.trim()) return;

		try {
			await api.post(`/member/posts/${selectedPost.id}/comments`, {
				content: replyText.trim(),
				parent_id: parentCommentId
			});
			setReplyText('');
			setReplyingTo(null);
			await loadComments(selectedPost.id);
		} catch (error) {
			console.error('Failed to add reply:', error);
		}
	}

	function startReply(commentId) {
		setReplyingTo(commentId);
		setReplyText('');
	}

	function cancelReply() {
		setReplyingTo(null);
		setReplyText('');
	}

	async function openShareModal(post) {
		setSelectedPost(post);
		setShowShareModal(true);
		setShareMessage('');
	}

	async function sharePost(e) {
		e.preventDefault();
		if (!selectedPost) return;

		setSharing(true);
		try {
			const { data } = await api.post(`/member/posts/${selectedPost.id}/share`, {
				share_message: shareMessage.trim()
			});

			setMessage('Post shared successfully!');
			setShowShareModal(false);
			setShareMessage('');
			await loadFeed(); // Refresh feed to show the shared post
			setTimeout(() => setMessage(''), 3000);
		} catch (error) {
			if (error.response?.data?.message) {
				setMessage(error.response.data.message);
			} else {
				setMessage('Failed to share post');
			}
			setTimeout(() => setMessage(''), 3000);
		} finally {
			setSharing(false);
		}
	}

	function formatTimeAgo(dateString) {
		const now = new Date();
		const postDate = new Date(dateString);
		const diffInSeconds = Math.floor((now - postDate) / 1000);

		if (diffInSeconds < 60) return 'Just now';
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
		return `${Math.floor(diffInSeconds / 86400)}d ago`;
	}

	if (loading) {
		return (
			<div className="p-6">
				<div className="flex items-center justify-center h-64">
					<div className="text-gray-500">Loading feed...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gray-100 min-h-screen">
			<div className="max-w-7xl mx-auto px-4 py-6">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					{/* Left Sidebar */}
					<div className="lg:col-span-3">
						<div className="bg-white rounded-lg shadow p-4 sticky top-6">
							<div className="space-y-4">
								{/* User Profile Section */}
								<div className="flex items-center space-x-3 pb-4 border-b">
									<div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
										U
									</div>
									<div>
										<div className="font-semibold">Gym Member</div>
										<div className="text-sm text-gray-500">Active Now</div>
									</div>
								</div>

								{/* Navigation Menu */}
								<div className="space-y-2">
									<div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
										<svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
											<path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
										</svg>
										<span>Home</span>
									</div>
									<div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
										<svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
											<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
										</svg>
										<span>Friends</span>
									</div>
									<div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
										<svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<span>Achievements</span>
									</div>
									<div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
										<svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
											<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
										</svg>
										<span>Progress</span>
									</div>
									<div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
										<svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
											<path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
										</svg>
										<span>Diet Plans</span>
									</div>
									<div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
										<svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
										</svg>
										<span>Goals</span>
									</div>
								</div>

								{/* Shortcuts */}
								<div className="pt-4 border-t">
									<h3 className="font-semibold text-gray-700 mb-3">Your Shortcuts</h3>
									<div className="space-y-2">
										<div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
											<div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
												<span className="text-red-600 text-sm">💪</span>
											</div>
											<span className="text-sm">Fitness Tips</span>
										</div>
										<div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
											<div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
												<span className="text-green-600 text-sm">🥗</span>
											</div>
											<span className="text-sm">Healthy Recipes</span>
										</div>
										<div className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer">
											<div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
												<span className="text-blue-600 text-sm">🏋️</span>
											</div>
											<span className="text-sm">Workout Plans</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Center Feed */}
					<div className="lg:col-span-6">
						<div className="space-y-4">
							{/* Create Post Box */}
							<div className="bg-white rounded-lg shadow p-4">
								<div className="flex items-center space-x-3 mb-4">
									<div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
										U
									</div>
									<button
										onClick={() => setShowCreateModal(true)}
										className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-3 text-left text-gray-500 cursor-pointer transition-colors"
									>
										What's on your mind?
									</button>
								</div>
								<div className="flex items-center justify-between pt-3 border-t">
									<button
										onClick={() => setShowCreateModal(true)}
										className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer"
									>
										<svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
										</svg>
										<span className="text-gray-600 font-medium">Photo/Video</span>
									</button>
									<button
										onClick={() => setShowCreateModal(true)}
										className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer"
									>
										<svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
											<path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
										</svg>
										<span className="text-gray-600 font-medium">Live Video</span>
									</button>
									<button
										onClick={() => setShowCreateModal(true)}
										className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer"
									>
										<svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
										</svg>
										<span className="text-gray-600 font-medium">Feeling/Activity</span>
									</button>
								</div>
							</div>

			{/* Create Post Modal */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
						<div className="p-6 border-b">
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-semibold">Create New Post</h2>
								<button
									onClick={() => setShowCreateModal(false)}
									className="text-gray-500 hover:text-gray-700 cursor-pointer"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
						
						<form onSubmit={createPost} className="p-6 space-y-4">
							<div>
								<label className="block text-sm mb-1">What's on your mind?</label>
								<textarea
									className="w-full border px-3 py-2 rounded"
									rows={4}
									placeholder="Share your fitness journey, achievements, or tips..."
									value={newPost.content}
									onChange={e => setNewPost(prev => ({ ...prev, content: e.target.value }))}
									required
								/>
							</div>
							
							<div>
								<label className="block text-sm mb-1">Add Image (Optional)</label>
								<input
									type="file"
									accept="image/*"
									className="w-full border px-3 py-2 rounded"
									onChange={e => setNewPost(prev => ({ ...prev, image: e.target.files[0] }))}
								/>
							</div>
							
							<div>.
								<label className="block text-sm mb-1">Visibility</label>
								<select
									className="w-full border px-3 py-2 rounded"
									value={newPost.visibility}
									onChange={e => setNewPost(prev => ({ ...prev, visibility: e.target.value }))}
								>
									<option value="public">Public - All gym members</option>
									<option value="gym_members">Gym Members Only</option>
								</select>
							</div>
							
							<div className="flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setShowCreateModal(false)}
									className="px-4 py-2 rounded border hover:bg-gray-50 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={submitting}
									className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
								>
									{submitting ? 'Posting...' : 'Post'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

							{/* Posts Feed */}
							{posts.length === 0 ? (
								<div className="bg-white rounded-lg shadow p-8 text-center">
									<div className="text-gray-500 mb-4">No posts yet</div>
									<button
										onClick={() => setShowCreateModal(true)}
										className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
									>
										Create First Post
									</button>
								</div>
							) : (
								posts.map(post => (
									<div key={post.id} className="bg-white rounded-lg shadow">
										{/* Post Header */}
										<div className="flex items-center justify-between p-4 pb-2">
											<div className="flex items-center space-x-3">
												<div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
													{post.user?.name?.charAt(0) || 'U'}
												</div>
												<div>
													<div className="font-semibold">{post.user?.name || 'Unknown User'}</div>
													<div className="text-sm text-gray-500">{formatTimeAgo(post.created_at)}</div>
												</div>
											</div>
											<div className="flex items-center space-x-2">
												<span className={`px-2 py-1 rounded text-xs ${
													post.visibility === 'public' 
														? 'bg-green-100 text-green-800' 
														: 'bg-blue-100 text-blue-800'
												}`}>
													{post.visibility === 'public' ? 'Public' : 'Gym Members'}
												</span>
												<button
													onClick={() => deletePost(post.id)}
													className="text-gray-400 hover:text-gray-600 cursor-pointer"
												>
													<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
													</svg>
												</button>
											</div>
										</div>

										{/* Post Content */}
										<div className="px-4 pb-3">
											<p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
										</div>

										{/* Post Image */}
										{post.image_path && (
											<div className="px-4 pb-3">
												<img
													src={`http://localhost:8000/storage/${post.image_path}`}
													alt="Post image"
													className="w-full max-h-96 object-cover rounded-lg"
													onError={(e) => {
														console.error('Image load error:', e);
														e.target.style.display = 'none';
													}}
												/>
											</div>
										)}

										{/* Post Actions */}
										<div className="px-4 py-3 border-t border-gray-100">
											<div className="flex items-center justify-between">
												<button
													onClick={() => likePost(post.id)}
													className={`flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${
														post.is_liked ? 'text-red-500' : 'text-gray-500'
													}`}
												>
													<svg className="w-5 h-5" fill={post.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
													</svg>
													<span className="font-medium">{post.likes_count}</span>
												</button>
												
												<button 
													onClick={() => openCommentsModal(post)}
													className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors text-gray-500"
												>
													<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
													</svg>
													<span className="font-medium">{post.comments_count}</span>
												</button>

												<button 
													onClick={() => openShareModal(post)}
													className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors text-gray-500"
												>
													<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
													</svg>
													<span className="font-medium">{post.shares_count || 0}</span>
												</button>
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>

					{/* Right Sidebar */}
					<div className="lg:col-span-3">
						<div className="space-y-4">
							{/* Birthdays */}
							<div className="bg-white rounded-lg shadow p-4">
								<h3 className="font-semibold text-gray-800 mb-3">Birthdays</h3>
								<div className="flex items-center space-x-3">
									<div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
										<span className="text-yellow-600 text-sm">🎂</span>
									</div>
									<div className="text-sm">
										<span className="font-medium">John Doe</span> and <span className="font-medium">3 others</span> have birthdays today.
									</div>
								</div>
							</div>

							{/* Contacts */}
							<div className="bg-white rounded-lg shadow p-4">
								<div className="flex items-center justify-between mb-4">
									<h3 className="font-semibold text-gray-800">Contacts</h3>
									<div className="flex space-x-2">
										<button className="text-gray-400 hover:text-gray-600 cursor-pointer">
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
											</svg>
										</button>
										<button className="text-gray-400 hover:text-gray-600 cursor-pointer">
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
											</svg>
										</button>
									</div>
								</div>
								<div className="space-y-3">
									{['Prashant', 'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'].map((name, index) => (
										<div key={index} className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded cursor-pointer">
											<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
												{name.charAt(0)}
											</div>
											<div className="flex-1">
												<div className="font-medium text-sm">{name}</div>
												<div className="text-xs text-gray-500">
													{index === 0 ? 'Active now' : `${Math.floor(Math.random() * 60)}m ago`}
												</div>
											</div>
											{index === 0 && (
												<div className="w-2 h-2 bg-green-500 rounded-full"></div>
											)}
										</div>
									))}
								</div>
							</div>

							{/* Suggested Groups */}
							<div className="bg-white rounded-lg shadow p-4">
								<div className="flex items-center justify-between mb-4">
									<h3 className="font-semibold text-gray-800">Suggested Groups</h3>
									<button className="text-blue-600 text-sm hover:underline cursor-pointer">See All</button>
								</div>
								<div className="space-y-3">
									<div className="flex items-center space-x-3">
										<div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
											<span className="text-white text-sm">💪</span>
										</div>
										<div className="flex-1">
											<div className="font-medium text-sm">Fitness Enthusiasts</div>
											<div className="text-xs text-gray-500">2,341 members</div>
										</div>
										<button className="text-blue-600 text-sm font-medium hover:underline cursor-pointer">Join</button>
									</div>
									<div className="flex items-center space-x-3">
										<div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
											<span className="text-white text-sm">🥗</span>
										</div>
										<div className="flex-1">
											<div className="font-medium text-sm">Healthy Eating</div>
											<div className="text-xs text-gray-500">1,892 members</div>
										</div>
										<button className="text-blue-600 text-sm font-medium hover:underline cursor-pointer">Join</button>
									</div>
									<div className="flex items-center space-x-3">
										<div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
											<span className="text-white text-sm">🏃</span>
										</div>
										<div className="flex-1">
											<div className="font-medium text-sm">Running Club</div>
											<div className="text-xs text-gray-500">956 members</div>
										</div>
										<button className="text-blue-600 text-sm font-medium hover:underline cursor-pointer">Join</button>
									</div>
								</div>
							</div>

							{/* Quick Actions */}
							<div className="bg-white rounded-lg shadow p-4">
								<h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
								<div className="space-y-2">
									<button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
										<svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
											<path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
										</svg>
										<span className="text-sm">View Progress</span>
									</button>
									<button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
										<svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
										</svg>
										<span className="text-sm">Mark Attendance</span>
									</button>
									<button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
										<svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
											<path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
										</svg>
										<span className="text-sm">Diet Plans</span>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Comments Modal */}
			{showCommentsModal && selectedPost && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
						<div className="p-6 border-b">
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-semibold">Comments</h2>
								<button
									onClick={() => {
										setShowCommentsModal(false);
										setSelectedPost(null);
										setComments([]);
										setReplyingTo(null);
									}}
									className="text-gray-500 hover:text-gray-700 cursor-pointer"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
						
						{/* Comments List */}
						<div className="flex-1 overflow-y-auto p-6 space-y-4">
							{comments.length === 0 ? (
								<div className="text-center text-gray-500 py-8">
									No comments yet. Be the first to comment!
								</div>
							) : (
								comments.map(comment => (
									<div key={comment.id} className="space-y-3">
										{/* Main Comment */}
										<div className="flex space-x-3">
											<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
												{comment.user?.name?.charAt(0) || 'U'}
											</div>
											<div className="flex-1">
												<div className="bg-gray-100 rounded-lg p-3">
													<div className="flex items-center space-x-2 mb-1">
														<span className="font-semibold text-sm">{comment.user?.name || 'Unknown User'}</span>
														<span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
													</div>
													<p className="text-sm text-gray-900">{comment.content}</p>
													<button
														onClick={() => startReply(comment.id)}
														className="text-xs text-blue-600 hover:underline mt-2 cursor-pointer"
													>
														Reply
													</button>
												</div>

												{/* Reply Form */}
												{replyingTo === comment.id && (
													<form onSubmit={(e) => addReply(e, comment.id)} className="mt-2">
														<div className="flex space-x-2">
															<input
																type="text"
																value={replyText}
																onChange={e => setReplyText(e.target.value)}
																placeholder="Write a reply..."
																className="flex-1 border rounded-lg px-3 py-2 text-sm"
																autoFocus
															/>
															<button
																type="submit"
																disabled={!replyText.trim()}
																className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 cursor-pointer disabled:opacity-50"
															>
																Reply
															</button>
															<button
																type="button"
																onClick={cancelReply}
																className="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-400 cursor-pointer"
															>
																Cancel
															</button>
														</div>
													</form>
												)}

												{/* Replies */}
												{comment.replies && comment.replies.length > 0 && (
													<div className="ml-4 mt-2 space-y-2">
														{comment.replies.map(reply => (
															<div key={reply.id} className="flex space-x-2">
																<div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
																	{reply.user?.name?.charAt(0) || 'U'}
																</div>
																<div className="flex-1">
																	<div className="bg-gray-50 rounded-lg p-2">
																		<div className="flex items-center space-x-2 mb-1">
																			<span className="font-semibold text-xs">{reply.user?.name || 'Unknown User'}</span>
																			<span className="text-xs text-gray-500">{formatTimeAgo(reply.created_at)}</span>
																		</div>
																		<p className="text-xs text-gray-900">{reply.content}</p>
																		<button
																			onClick={() => startReply(reply.id)}
																			className="text-xs text-blue-600 hover:underline mt-1 cursor-pointer"
																		>
																			Reply
																		</button>
																	</div>
																</div>
															</div>
														))}
													</div>
												)}
											</div>
										</div>
									</div>
								))
							)}
						</div>

						{/* Add Comment Form */}
						<div className="p-6 border-t">
							<form onSubmit={addComment} className="flex space-x-3">
								<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
									U
								</div>
								<input
									type="text"
									value={newComment}
									onChange={e => setNewComment(e.target.value)}
									placeholder="Write a comment..."
									className="flex-1 border rounded-lg px-3 py-2"
								/>
								<button
									type="submit"
									disabled={!newComment.trim()}
									className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50"
								>
									Comment
								</button>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Share Modal */}
			{showShareModal && selectedPost && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
						<div className="p-6 border-b">
							<div className="flex justify-between items-center">
								<h2 className="text-xl font-semibold">Share Post</h2>
								<button
									onClick={() => {
										setShowShareModal(false);
										setSelectedPost(null);
										setShareMessage('');
									}}
									className="text-gray-500 hover:text-gray-700 cursor-pointer"
								>
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
						
						{/* Original Post Preview */}
						<div className="p-6 border-b bg-gray-50">
							<div className="text-sm text-gray-600 mb-3">Sharing this post:</div>
							<div className="flex items-center space-x-3 mb-3">
								<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
									{selectedPost.user?.name?.charAt(0) || 'U'}
								</div>
								<div>
									<div className="font-semibold text-sm">{selectedPost.user?.name || 'Unknown User'}</div>
									<div className="text-xs text-gray-500">{formatTimeAgo(selectedPost.created_at)}</div>
								</div>
							</div>
							<div className="text-sm text-gray-900 mb-3">
								{selectedPost.content.length > 150 
									? selectedPost.content.substring(0, 150) + '...' 
									: selectedPost.content
								}
							</div>
							{selectedPost.image_path && (
								<div className="mb-3">
									<img
										src={`http://localhost:8000/storage/${selectedPost.image_path}`}
										alt="Post image"
										className="w-32 h-20 object-cover rounded"
									/>
								</div>
							)}
						</div>

						{/* Share Form */}
						<form onSubmit={sharePost} className="p-6">
							<div className="mb-4">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Add a message (optional)
								</label>
								<textarea
									value={shareMessage}
									onChange={e => setShareMessage(e.target.value)}
									placeholder="What's on your mind about this post?"
									className="w-full border rounded-lg px-3 py-2"
									rows={3}
									maxLength={500}
								/>
								<div className="text-xs text-gray-500 mt-1">
									{shareMessage.length}/500 characters
								</div>
							</div>
							
							<div className="flex justify-end space-x-3">
								<button
									type="button"
									onClick={() => {
										setShowShareModal(false);
										setSelectedPost(null);
										setShareMessage('');
									}}
									className="px-4 py-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={sharing}
									className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
								>
									{sharing ? 'Sharing...' : 'Share Post'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

		{/* Message */}
		{message && (
			<div className={`fixed top-4 right-4 p-4 rounded shadow-lg z-50 ${
				message.includes('successfully') 
					? 'bg-green-100 border border-green-400 text-green-700' 
					: 'bg-red-100 border border-red-400 text-red-700'
			}`}>
				{message}
			</div>
		)}
		</div>
	);
}
