export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query
      });
      req.validated = validated;
      next();
    } catch (err) {
      const errors = err.errors?.map((e) => ({ path: e.path.join('.'), message: e.message })) || [];
      return res.status(400).json({ message: 'Validation failed', errors });
    }
  };
};
