FROM nginx:1.23.1

# Mount the desired project's folder to `/project`
# See each project's `README.md` for specific examples
CMD ["nginx", "-g", "daemon off;", "-c", "/project/nginx.conf"]