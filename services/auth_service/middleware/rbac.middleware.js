exports.rbac=(allowedRoles)=>{
    return (req,res,next)=>{
        const userRole=req.user.role;
        if(allowedRoles.includes(userRole)){
            next(); // User has permission, proceed to the next middleware or route handler
        }else{
            res.status(403).json({ status: 'error', code: 403, msg: 'Access denied. Insufficient permissions.', data: null });
        }
    }
}
