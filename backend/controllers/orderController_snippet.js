
// @desc    Forward order to Big Scrapper
// @route   POST /api/orders/:id/forward
// @access  Private (Small Scrapper)
export const forwardOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const scrapperId = req.user.id; // Small Scrapper ID

    const order = await Order.findById(id);

    if (!order) {
        return sendError(res, 'Order not found', 404);
    }

    // Check if user is a scrapper
    const scrapper = await Scrapper.findById(scrapperId);
    if (!scrapper || !['small', 'feri_wala'].includes(scrapper.scrapperType)) {
        return sendError(res, 'Only feri wala / small scrappers can forward orders', 403);
    }

    // Check if order is available or assigned to this scrapper
    // Technically a small scrapper could forward an order they see in "available" list even if not assigned?
    // Or they must accept it first? The requirement says "Small Scrapper -> Big Scrapper".
    // Let's assume they can forward from the dashboard where they see the request.

    // If order is already forwarded
    if (order.forwardedBy) {
        return sendError(res, 'Order already forwarded', 400);
    }

    // Update order to be 'large' (so Big Scrappers see it) and set forwardedBy
    order.quantityType = 'large';
    order.forwardedBy = scrapperId;

    // If it was assigned to this scrapper, unassign it so big scrappers can pick it up
    if (order.scrapper && order.scrapper.toString() === scrapperId) {
        order.assignmentStatus = 'unassigned';
        order.scrapper = null;
        order.status = ORDER_STATUS.PENDING;
    }

    await order.save();

    logger.info(`Order ${id} forwarded by Small Scrapper ${scrapperId}`);

    sendSuccess(res, 'Order forwarded to Big Scrappers successfully', { order });
});
